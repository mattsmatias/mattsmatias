# Walleta - Taloudenhallintasovellus PRD

## Alkuperäinen Ongelma
Walleta on helppokäyttöinen taloudenhallintasovellus, joka auttaa ihmisiä ymmärtämään, hallitsemaan ja parantamaan omaa talouttaan arjessa – ilman stressiä tai monimutkaisuutta.

## Käyttäjäpersoonat
- **Nuoret aikuiset**: Ensimmäistä kertaa itsenäistyvät, tarvitsevat yksinkertaista budjetointia
- **Opiskelijat**: Rajoitettu budjetti, opintolainan seuranta
- **Perheet**: Monitahoiset menot, säästötavoitteet lapsille
- **Kaikki talouteen heränneet**: Haluavat paremman otteen rahankäytöstään

## Ydinvaatimukset (Staattinen)
1. Budjetointi - kuukausibudjetin asettaminen ja seuranta
2. Menoseuranta - kulujen lisääminen ja kategorisointi
3. Tulot - tulojen hallinta ja seuranta
4. Lainojen hallinta - asuntolainat, autolainat, kulutusluotot, opintolainat
5. Säästötavoitteet - tavoitteiden asettaminen ja edistymisen seuranta
6. Selkeät raportit - viikko-, kuukausi- ja vuositason näkymät

## Toteutetut Ominaisuudet (21.1.2025)

### MVP - Valmis ✅
- **Landing Page**: Hero-osio, ominaisuudet, hinnoittelu (4,99€/kk), CTA-napit
- **Autentikointi**: JWT-pohjainen kirjautuminen ja rekisteröinti
- **Stripe-maksuintegraatio**: Kuukausitilaus 4,99€, checkout-flow
- **Dashboard**: Yleiskatsaus budjettiin, tuloihin, menoihin, lainoihin, säästöihin
- **Budjetointi**: Kuukausibudjetin asettaminen, käyttöasteen seuranta, kategoriajako
- **Menot**: Lisäys, kategorisointi (8 kategoriaa), poisto, päivämääräryhmittely
- **Tulot**: Lisäys, lähteen valinta (palkka, freelance, sijoitukset, muu), toistuvat tulot
- **Lainat**: CRUD, 4 lainatyyppiä, maksetun osuuden seuranta
- **Säästötavoitteet**: CRUD, ikonivalinta, edistymispalkki, tavoitepäivä

### Tekniset Toteutukset
- **Backend**: FastAPI + MongoDB, JWT-autentikointi, Stripe emergentintegrations
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Design**: Nordic Clarity -teema, tummat data-kortit, vihreä/oranssi aksentit
- **Kieli**: Täysin suomenkielinen käyttöliittymä, EUR-valuutta

## Priorisoidut Jäljellä Olevat Ominaisuudet

### P0 (Kriittinen)
- [ ] Salasanan palautus -toiminto

### P1 (Tärkeä)
- [ ] Raportit-sivu (viikko/kuukausi/vuosi graafit)
- [ ] Asetukset-sivu (profiilin muokkaus, tilauksen hallinta)
- [ ] Budjettivaroitus sähköpostilla

### P2 (Mukava Olla)
- [ ] Toistuvan kulun/tulon automaattinen lisäys
- [ ] CSV-tiedoston tuonti pankilta
- [ ] Tumma teema -vaihtoehto
- [ ] PWA/mobiilisovellus

## Seuraavat Toimenpiteet
1. Raportit-sivun toteutus graafeilla (Recharts)
2. Asetukset-sivun toteutus
3. Salasanan palautus -sähköpostitoiminto
