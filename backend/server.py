from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import time
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'walleta-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
SUBSCRIPTION_PRICE = 4.99  # EUR/month

# Nordigen/GoCardless Configuration
NORDIGEN_SECRET_ID = os.environ.get('NORDIGEN_SECRET_ID', '')
NORDIGEN_SECRET_KEY = os.environ.get('NORDIGEN_SECRET_KEY', '')
NORDIGEN_API_URL = "https://bankaccountdata.gocardless.com/api/v2"

# Create the main app
app = FastAPI(title="Walleta API", description="Personal Finance Management")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== MODELS ==============

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    subscription_active: bool = False
    subscription_end: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class BudgetBase(BaseModel):
    amount: float
    month: str  # YYYY-MM format
    
class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    created_at: str

class ExpenseCategory(BaseModel):
    name: str
    icon: str = "receipt"
    color: str = "#F59E0B"

class ExpenseBase(BaseModel):
    amount: float
    description: str
    category: str
    date: str  # ISO date string

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    created_at: str

class IncomeBase(BaseModel):
    amount: float
    description: str
    source: str  # salary, freelance, investment, other
    date: str
    recurring: bool = False

class IncomeCreate(IncomeBase):
    pass

class Income(IncomeBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    created_at: str

class LoanBase(BaseModel):
    name: str
    loan_type: str  # asuntolaina, autolaina, kulutusluotto, opintolaina
    original_amount: float
    remaining_amount: float
    interest_rate: float
    monthly_payment: float
    start_date: str
    end_date: Optional[str] = None

class LoanCreate(LoanBase):
    pass

class Loan(LoanBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    created_at: str

class SavingsGoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[str] = None
    icon: str = "piggy-bank"

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoal(SavingsGoalBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    created_at: str

class CheckoutRequest(BaseModel):
    origin_url: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    session_id: str
    amount: float
    currency: str
    status: str
    payment_status: str
    metadata: Dict = {}
    created_at: str
    updated_at: str


# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token vanhentunut")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Virheellinen token")

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Kirjautuminen vaaditaan")
    
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Käyttäjää ei löydy")
    
    return user


# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Sähköposti on jo käytössä")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hash_password(user_data.password),
        "subscription_active": False,
        "subscription_end": None,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    # Create token
    token = create_token(user_id, user_data.email)
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        subscription_active=False,
        subscription_end=None,
        created_at=now
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Virheellinen sähköposti tai salasana")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Virheellinen sähköposti tai salasana")
    
    token = create_token(user["id"], user["email"])
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        subscription_active=user.get("subscription_active", False),
        subscription_end=user.get("subscription_end"),
        created_at=user["created_at"]
    )
    
    return TokenResponse(token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        subscription_active=user.get("subscription_active", False),
        subscription_end=user.get("subscription_end"),
        created_at=user["created_at"]
    )


# ============== STRIPE PAYMENT ROUTES ==============

@api_router.post("/payments/checkout")
async def create_checkout_session(request: Request, checkout_data: CheckoutRequest, user: dict = Depends(get_current_user)):
    try:
        # Build URLs
        success_url = f"{checkout_data.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{checkout_data.origin_url}/payment/cancel"
        
        # Initialize Stripe
        webhook_url = f"{str(request.base_url)}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=SUBSCRIPTION_PRICE,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": user["id"],
                "user_email": user["email"],
                "product": "walleta_subscription"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        now = datetime.now(timezone.utc).isoformat()
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "session_id": session.session_id,
            "amount": SUBSCRIPTION_PRICE,
            "currency": "EUR",
            "status": "pending",
            "payment_status": "initiated",
            "metadata": {
                "user_id": user["id"],
                "user_email": user["email"],
                "product": "walleta_subscription"
            },
            "created_at": now,
            "updated_at": now
        }
        
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {"url": session.url, "session_id": session.session_id}
        
    except Exception as e:
        logger.error(f"Checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Maksun luominen epäonnistui")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(request: Request, session_id: str, user: dict = Depends(get_current_user)):
    try:
        # Initialize Stripe
        webhook_url = f"{str(request.base_url)}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get status
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if already processed
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id, "user_id": user["id"]},
            {"_id": 0}
        )
        
        if transaction and transaction.get("payment_status") == "paid":
            return {
                "status": "complete",
                "payment_status": "paid",
                "already_processed": True
            }
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status.status,
                "payment_status": status.payment_status,
                "updated_at": now
            }}
        )
        
        # If paid, activate subscription
        if status.payment_status == "paid":
            subscription_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "subscription_active": True,
                    "subscription_end": subscription_end
                }}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail="Maksun tilan tarkistus epäonnistui")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_url = f"{str(request.base_url)}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.session_id:
            now = datetime.now(timezone.utc).isoformat()
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "status": webhook_response.event_type,
                    "payment_status": webhook_response.payment_status,
                    "updated_at": now
                }}
            )
            
            # Activate subscription if paid
            if webhook_response.payment_status == "paid":
                user_id = webhook_response.metadata.get("user_id")
                if user_id:
                    subscription_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
                    await db.users.update_one(
                        {"id": user_id},
                        {"$set": {
                            "subscription_active": True,
                            "subscription_end": subscription_end
                        }}
                    )
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


# ============== BUDGET ROUTES ==============

@api_router.post("/budgets", response_model=Budget)
async def create_budget(budget_data: BudgetCreate, user: dict = Depends(get_current_user)):
    budget_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if budget exists for month
    existing = await db.budgets.find_one({
        "user_id": user["id"],
        "month": budget_data.month
    })
    
    if existing:
        # Update existing
        await db.budgets.update_one(
            {"id": existing["id"]},
            {"$set": {"amount": budget_data.amount, "updated_at": now}}
        )
        return Budget(
            id=existing["id"],
            user_id=user["id"],
            amount=budget_data.amount,
            month=budget_data.month,
            created_at=existing.get("created_at", now)
        )
    
    budget_doc = {
        "id": budget_id,
        "user_id": user["id"],
        "amount": budget_data.amount,
        "month": budget_data.month,
        "created_at": now
    }
    
    await db.budgets.insert_one(budget_doc)
    
    return Budget(**{k: v for k, v in budget_doc.items() if k != "_id"})

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(user: dict = Depends(get_current_user)):
    budgets = await db.budgets.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("month", -1).to_list(100)
    return budgets

@api_router.get("/budgets/current", response_model=Optional[Budget])
async def get_current_budget(user: dict = Depends(get_current_user)):
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    budget = await db.budgets.find_one(
        {"user_id": user["id"], "month": current_month},
        {"_id": 0}
    )
    return budget


# ============== EXPENSE ROUTES ==============

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, user: dict = Depends(get_current_user)):
    expense_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    expense_doc = {
        "id": expense_id,
        "user_id": user["id"],
        "amount": expense_data.amount,
        "description": expense_data.description,
        "category": expense_data.category,
        "date": expense_data.date,
        "created_at": now
    }
    
    await db.expenses.insert_one(expense_doc)
    
    return Expense(**{k: v for k, v in expense_doc.items() if k != "_id"})

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(
    month: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"user_id": user["id"]}
    
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return expenses

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user: dict = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kulua ei löydy")
    return {"message": "Kulu poistettu"}


# ============== INCOME ROUTES ==============

@api_router.post("/incomes", response_model=Income)
async def create_income(income_data: IncomeCreate, user: dict = Depends(get_current_user)):
    income_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    income_doc = {
        "id": income_id,
        "user_id": user["id"],
        "amount": income_data.amount,
        "description": income_data.description,
        "source": income_data.source,
        "date": income_data.date,
        "recurring": income_data.recurring,
        "created_at": now
    }
    
    await db.incomes.insert_one(income_doc)
    
    return Income(**{k: v for k, v in income_doc.items() if k != "_id"})

@api_router.get("/incomes", response_model=List[Income])
async def get_incomes(
    month: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"user_id": user["id"]}
    
    if month:
        query["date"] = {"$regex": f"^{month}"}
    
    incomes = await db.incomes.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return incomes

@api_router.delete("/incomes/{income_id}")
async def delete_income(income_id: str, user: dict = Depends(get_current_user)):
    result = await db.incomes.delete_one({"id": income_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tuloa ei löydy")
    return {"message": "Tulo poistettu"}


# ============== LOAN ROUTES ==============

@api_router.post("/loans", response_model=Loan)
async def create_loan(loan_data: LoanCreate, user: dict = Depends(get_current_user)):
    loan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    loan_doc = {
        "id": loan_id,
        "user_id": user["id"],
        "name": loan_data.name,
        "loan_type": loan_data.loan_type,
        "original_amount": loan_data.original_amount,
        "remaining_amount": loan_data.remaining_amount,
        "interest_rate": loan_data.interest_rate,
        "monthly_payment": loan_data.monthly_payment,
        "start_date": loan_data.start_date,
        "end_date": loan_data.end_date,
        "created_at": now
    }
    
    await db.loans.insert_one(loan_doc)
    
    return Loan(**{k: v for k, v in loan_doc.items() if k != "_id"})

@api_router.get("/loans", response_model=List[Loan])
async def get_loans(user: dict = Depends(get_current_user)):
    loans = await db.loans.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return loans

@api_router.put("/loans/{loan_id}", response_model=Loan)
async def update_loan(loan_id: str, loan_data: LoanCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = loan_data.model_dump()
    update_data["updated_at"] = now
    
    result = await db.loans.update_one(
        {"id": loan_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lainaa ei löydy")
    
    loan = await db.loans.find_one({"id": loan_id}, {"_id": 0})
    return Loan(**loan)

@api_router.delete("/loans/{loan_id}")
async def delete_loan(loan_id: str, user: dict = Depends(get_current_user)):
    result = await db.loans.delete_one({"id": loan_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lainaa ei löydy")
    return {"message": "Laina poistettu"}


# ============== SAVINGS GOAL ROUTES ==============

@api_router.post("/savings", response_model=SavingsGoal)
async def create_savings_goal(goal_data: SavingsGoalCreate, user: dict = Depends(get_current_user)):
    goal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    goal_doc = {
        "id": goal_id,
        "user_id": user["id"],
        "name": goal_data.name,
        "target_amount": goal_data.target_amount,
        "current_amount": goal_data.current_amount,
        "target_date": goal_data.target_date,
        "icon": goal_data.icon,
        "created_at": now
    }
    
    await db.savings_goals.insert_one(goal_doc)
    
    return SavingsGoal(**{k: v for k, v in goal_doc.items() if k != "_id"})

@api_router.get("/savings", response_model=List[SavingsGoal])
async def get_savings_goals(user: dict = Depends(get_current_user)):
    goals = await db.savings_goals.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return goals

@api_router.put("/savings/{goal_id}", response_model=SavingsGoal)
async def update_savings_goal(goal_id: str, goal_data: SavingsGoalCreate, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    
    update_data = goal_data.model_dump()
    update_data["updated_at"] = now
    
    result = await db.savings_goals.update_one(
        {"id": goal_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Säästötavoitetta ei löydy")
    
    goal = await db.savings_goals.find_one({"id": goal_id}, {"_id": 0})
    return SavingsGoal(**goal)

@api_router.delete("/savings/{goal_id}")
async def delete_savings_goal(goal_id: str, user: dict = Depends(get_current_user)):
    result = await db.savings_goals.delete_one({"id": goal_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Säästötavoitetta ei löydy")
    return {"message": "Säästötavoite poistettu"}


# ============== DASHBOARD/STATS ROUTES ==============

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(user: dict = Depends(get_current_user)):
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    # Get current budget
    budget = await db.budgets.find_one(
        {"user_id": user["id"], "month": current_month},
        {"_id": 0}
    )
    
    # Get monthly expenses
    expenses = await db.expenses.find(
        {"user_id": user["id"], "date": {"$regex": f"^{current_month}"}},
        {"_id": 0}
    ).to_list(1000)
    
    total_expenses = sum(e["amount"] for e in expenses)
    
    # Group expenses by category
    category_totals = {}
    for expense in expenses:
        cat = expense.get("category", "Muut")
        category_totals[cat] = category_totals.get(cat, 0) + expense["amount"]
    
    expense_categories = [
        {"name": name, "amount": amount, "percentage": round((amount / total_expenses * 100) if total_expenses > 0 else 0, 1)}
        for name, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Get monthly incomes
    incomes = await db.incomes.find(
        {"user_id": user["id"], "date": {"$regex": f"^{current_month}"}},
        {"_id": 0}
    ).to_list(1000)
    
    total_income = sum(i["amount"] for i in incomes)
    
    # Group incomes by source
    source_totals = {}
    source_labels = {
        "salary": "Palkka",
        "freelance": "Freelance-työt",
        "investment": "Sijoitukset",
        "other": "Muut tulot"
    }
    for income in incomes:
        source = income.get("source", "other")
        label = source_labels.get(source, source)
        source_totals[label] = source_totals.get(label, 0) + income["amount"]
    
    income_sources = [
        {"name": name, "amount": amount}
        for name, amount in sorted(source_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Get loans summary
    loans = await db.loans.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    total_loans = sum(l["remaining_amount"] for l in loans)
    total_monthly_loan_payments = sum(l["monthly_payment"] for l in loans)
    
    # Get savings summary
    savings = await db.savings_goals.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    total_saved = sum(s["current_amount"] for s in savings)
    total_savings_target = sum(s["target_amount"] for s in savings)
    
    # Calculate budget usage
    budget_amount = budget["amount"] if budget else 0
    budget_percentage = (total_expenses / budget_amount * 100) if budget_amount > 0 else 0
    
    # Calculate remaining money
    remaining = total_income - total_expenses - total_monthly_loan_payments
    remaining_percentage = round((remaining / total_income * 100) if total_income > 0 else 0, 0)
    
    return {
        "budget": {
            "amount": budget_amount,
            "spent": total_expenses,
            "percentage": round(budget_percentage, 1),
            "remaining": budget_amount - total_expenses
        },
        "income": {
            "total": total_income,
            "count": len(incomes),
            "sources": income_sources
        },
        "expenses": {
            "total": total_expenses,
            "count": len(expenses),
            "recent": expenses[:5],
            "categories": expense_categories
        },
        "loans": {
            "total_remaining": total_loans,
            "monthly_payments": total_monthly_loan_payments,
            "count": len(loans)
        },
        "savings": {
            "total_saved": total_saved,
            "total_target": total_savings_target,
            "count": len(savings)
        },
        "balance": {
            "remaining": remaining,
            "remaining_percentage": remaining_percentage,
            "net_worth": total_saved - total_loans
        },
        "month": current_month
    }

@api_router.get("/categories")
async def get_expense_categories():
    """Return predefined expense categories"""
    return [
        {"name": "Asuminen", "icon": "home", "color": "#3B82F6"},
        {"name": "Ruoka", "icon": "utensils", "color": "#10B981"},
        {"name": "Liikenne", "icon": "car", "color": "#8B5CF6"},
        {"name": "Viihde", "icon": "gamepad", "color": "#EC4899"},
        {"name": "Terveys", "icon": "heart", "color": "#EF4444"},
        {"name": "Vaatteet", "icon": "shirt", "color": "#F59E0B"},
        {"name": "Koulutus", "icon": "book", "color": "#06B6D4"},
        {"name": "Muut", "icon": "receipt", "color": "#6B7280"}
    ]


# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "Walleta API", "status": "ok"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "walleta-api"}


# ============== NORDIGEN BANK CONNECTION ==============

class NordigenTokenManager:
    """Manages Nordigen API tokens"""
    def __init__(self):
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.token_expiry: float = 0
    
    async def get_access_token(self) -> str:
        current_time = time.time()
        
        if self.access_token and current_time < self.token_expiry:
            return self.access_token
        
        if self.refresh_token and current_time > self.token_expiry:
            return await self._refresh_access_token()
        
        return await self._generate_new_token_pair()
    
    async def _generate_new_token_pair(self) -> str:
        if not NORDIGEN_SECRET_ID or not NORDIGEN_SECRET_KEY:
            raise HTTPException(status_code=500, detail="Nordigen credentials not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NORDIGEN_API_URL}/token/new/",
                json={
                    "secret_id": NORDIGEN_SECRET_ID,
                    "secret_key": NORDIGEN_SECRET_KEY
                }
            )
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data["access"]
            self.refresh_token = data["refresh"]
            self.token_expiry = time.time() + 86400  # 24 hours
            
            return self.access_token
    
    async def _refresh_access_token(self) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{NORDIGEN_API_URL}/token/refresh/",
                json={"refresh": self.refresh_token}
            )
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data["access"]
            self.token_expiry = time.time() + 86400
            
            return self.access_token

nordigen_token_manager = NordigenTokenManager()


class BankInstitution(BaseModel):
    id: str
    name: str
    bic: str = ""
    logo: Optional[str] = None
    countries: List[str] = []

class BankConnectionRequest(BaseModel):
    institution_id: str
    redirect_url: str

class BankConnectionResponse(BaseModel):
    id: str
    link: str
    institution_id: str
    status: str

class BankAccount(BaseModel):
    id: str
    iban: str
    name: str
    currency: str
    balance: float = 0

class BankTransaction(BaseModel):
    id: str
    date: str
    amount: float
    currency: str
    description: str
    category: Optional[str] = None


@api_router.get("/banks/finland", response_model=List[BankInstitution])
async def get_finnish_banks():
    """Get list of Finnish banks supported by Nordigen"""
    try:
        access_token = await nordigen_token_manager.get_access_token()
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"{NORDIGEN_API_URL}/institutions/?country=FI",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            
            institutions = response.json()
            
            banks = [
                BankInstitution(
                    id=inst["id"],
                    name=inst["name"],
                    bic=inst.get("bic", ""),
                    logo=inst.get("logo"),
                    countries=inst.get("countries", ["FI"])
                )
                for inst in institutions
            ]
            
            return banks
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch banks: {str(e)}")
        raise HTTPException(status_code=500, detail="Pankkien haku epäonnistui")
    except Exception as e:
        logger.error(f"Error fetching banks: {str(e)}")
        raise HTTPException(status_code=500, detail="Pankkien haku epäonnistui")


@api_router.post("/banks/connect", response_model=BankConnectionResponse)
async def create_bank_connection(
    request_data: BankConnectionRequest,
    user: dict = Depends(get_current_user)
):
    """Create a bank connection requisition"""
    try:
        access_token = await nordigen_token_manager.get_access_token()
        reference = f"walleta_{user['id']}_{str(uuid.uuid4())[:8]}"
        
        async with httpx.AsyncClient() as http_client:
            # Create end user agreement
            agreement_response = await http_client.post(
                f"{NORDIGEN_API_URL}/agreements/enduser/",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "institution_id": request_data.institution_id,
                    "max_historical_days": 90,
                    "access_valid_for_days": 90,
                    "access_scope": ["balances", "details", "transactions"]
                }
            )
            agreement_response.raise_for_status()
            agreement = agreement_response.json()
            
            # Create requisition
            requisition_response = await http_client.post(
                f"{NORDIGEN_API_URL}/requisitions/",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "redirect": request_data.redirect_url,
                    "institution_id": request_data.institution_id,
                    "reference": reference,
                    "agreement": agreement["id"],
                    "user_language": "FI"
                }
            )
            requisition_response.raise_for_status()
            requisition = requisition_response.json()
            
            # Store requisition in database
            now = datetime.now(timezone.utc).isoformat()
            await db.bank_connections.insert_one({
                "id": requisition["id"],
                "user_id": user["id"],
                "institution_id": request_data.institution_id,
                "agreement_id": agreement["id"],
                "reference": reference,
                "status": requisition.get("status", "CR"),
                "created_at": now
            })
            
            return BankConnectionResponse(
                id=requisition["id"],
                link=requisition["link"],
                institution_id=request_data.institution_id,
                status=requisition.get("status", "CR")
            )
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to create bank connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Pankkiyhteyden luonti epäonnistui")


@api_router.get("/banks/connections")
async def get_bank_connections(user: dict = Depends(get_current_user)):
    """Get user's bank connections"""
    connections = await db.bank_connections.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    return connections


@api_router.get("/banks/connection/{requisition_id}/accounts")
async def get_connection_accounts(requisition_id: str, user: dict = Depends(get_current_user)):
    """Get accounts from a bank connection"""
    try:
        # Verify connection belongs to user
        connection = await db.bank_connections.find_one({
            "id": requisition_id,
            "user_id": user["id"]
        })
        if not connection:
            raise HTTPException(status_code=404, detail="Yhteyttä ei löydy")
        
        access_token = await nordigen_token_manager.get_access_token()
        
        async with httpx.AsyncClient() as http_client:
            # Get requisition details
            req_response = await http_client.get(
                f"{NORDIGEN_API_URL}/requisitions/{requisition_id}/",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            req_response.raise_for_status()
            req_data = req_response.json()
            
            # Update status
            await db.bank_connections.update_one(
                {"id": requisition_id},
                {"$set": {"status": req_data.get("status", ""), "accounts": req_data.get("accounts", [])}}
            )
            
            accounts = []
            for account_id in req_data.get("accounts", []):
                # Get account details
                acc_response = await http_client.get(
                    f"{NORDIGEN_API_URL}/accounts/{account_id}/details/",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                if acc_response.status_code == 200:
                    acc_data = acc_response.json().get("account", {})
                    
                    # Get balance
                    bal_response = await http_client.get(
                        f"{NORDIGEN_API_URL}/accounts/{account_id}/balances/",
                        headers={"Authorization": f"Bearer {access_token}"}
                    )
                    balance = 0
                    if bal_response.status_code == 200:
                        balances = bal_response.json().get("balances", [])
                        if balances:
                            balance = float(balances[0].get("balanceAmount", {}).get("amount", 0))
                    
                    accounts.append(BankAccount(
                        id=account_id,
                        iban=acc_data.get("iban", ""),
                        name=acc_data.get("name", acc_data.get("product", "Tili")),
                        currency=acc_data.get("currency", "EUR"),
                        balance=balance
                    ))
            
            return {"accounts": accounts, "status": req_data.get("status")}
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch accounts: {str(e)}")
        raise HTTPException(status_code=500, detail="Tilien haku epäonnistui")


@api_router.get("/banks/account/{account_id}/transactions")
async def get_account_transactions(
    account_id: str,
    user: dict = Depends(get_current_user)
):
    """Get transactions from a bank account"""
    try:
        access_token = await nordigen_token_manager.get_access_token()
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"{NORDIGEN_API_URL}/accounts/{account_id}/transactions/",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            data = response.json()
            
            transactions = []
            for trans in data.get("transactions", {}).get("booked", []):
                amount = float(trans.get("transactionAmount", {}).get("amount", 0))
                description = trans.get("remittanceInformationUnstructured", "") or trans.get("creditorName", "") or trans.get("debtorName", "Tapahtuma")
                
                transactions.append(BankTransaction(
                    id=trans.get("transactionId", str(uuid.uuid4())),
                    date=trans.get("bookingDate", ""),
                    amount=amount,
                    currency=trans.get("transactionAmount", {}).get("currency", "EUR"),
                    description=description,
                    category=None
                ))
            
            return {"transactions": transactions}
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Tapahtumien haku epäonnistui")


@api_router.post("/banks/import-transactions/{account_id}")
async def import_transactions(
    account_id: str,
    user: dict = Depends(get_current_user)
):
    """Import transactions from bank to Walleta expenses/incomes"""
    try:
        access_token = await nordigen_token_manager.get_access_token()
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"{NORDIGEN_API_URL}/accounts/{account_id}/transactions/",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            data = response.json()
            
            imported_count = 0
            now = datetime.now(timezone.utc).isoformat()
            
            for trans in data.get("transactions", {}).get("booked", []):
                amount = float(trans.get("transactionAmount", {}).get("amount", 0))
                description = trans.get("remittanceInformationUnstructured", "") or trans.get("creditorName", "") or trans.get("debtorName", "Pankkitapahtuma")
                date = trans.get("bookingDate", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
                transaction_id = trans.get("transactionId", "")
                
                # Check if already imported
                existing = await db.imported_transactions.find_one({
                    "user_id": user["id"],
                    "transaction_id": transaction_id
                })
                if existing:
                    continue
                
                if amount < 0:
                    # Expense
                    expense_id = str(uuid.uuid4())
                    await db.expenses.insert_one({
                        "id": expense_id,
                        "user_id": user["id"],
                        "amount": abs(amount),
                        "description": description,
                        "category": "Muut",
                        "date": date,
                        "created_at": now,
                        "imported": True
                    })
                else:
                    # Income
                    income_id = str(uuid.uuid4())
                    await db.incomes.insert_one({
                        "id": income_id,
                        "user_id": user["id"],
                        "amount": amount,
                        "description": description,
                        "source": "other",
                        "date": date,
                        "recurring": False,
                        "created_at": now,
                        "imported": True
                    })
                
                # Mark as imported
                await db.imported_transactions.insert_one({
                    "user_id": user["id"],
                    "transaction_id": transaction_id,
                    "account_id": account_id,
                    "imported_at": now
                })
                imported_count += 1
            
            return {"message": f"Tuotiin {imported_count} tapahtumaa", "imported_count": imported_count}
            
    except httpx.HTTPError as e:
        logger.error(f"Failed to import transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Tapahtumien tuonti epäonnistui")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
