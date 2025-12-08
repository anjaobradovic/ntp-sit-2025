Hangman+ za studente medicine
1. Uvod
Ovaj projekat predstavlja implementaciju igre Hangman+ u programskom jeziku Rust. Igra je terminalna aplikacija koja omogućava korisnicima da se registruju, prijave i biraju temu, jezik pogadjanja, igraju protiv drugog korisnika, i prate statistiku svojih igara. Takođe, postoji admin panel za upravljanje korisnicima, riječima, temama… 
Ideja jeste olaksati i učinit zanimljivo ucenje prvenstveno studentima medicine a zatim i svim ostalim korisnicima zainteresovanim za anatomiju ljudskog tijela.
Igra je koncepirana tako da se korisnik prijavljuje, bira jezik (srpski/latinski), kao i temu (kosti/organi) i zatim pristupa samoj igri. Prikazace mu se fotografije i on ce kao zadatak imati da pogodi naziv sa slike uz sto manje gresaka. Svaka greska ce rezultirati crtanjem dijela tijela “cicaglise” na vjesalu i eventualni poraz ili pobjedu.

2. Funkcionalni zahtevi
2.1. Korisnički nalozi
Registracija: username, email, password (hashiran)
Prijava: autentikacija korisnika
Evidencija statistike (pobjede, porazi)
2.2. Početna stranica (Terminal UI)
Meni:
Play single player
Play multiplayer
Stats (prijavljeni korisnik)
Settings
Logout
(Admin) Admin panel
2.3. Single Player
Izbor teme
ASCII vješala sa 7 faza:
Glava
Tijelo
Desna noga
Lijeva noga
Desna ruka
Lijeva ruka
Kosa
Prikaz pobjede ili poraza
Evidencija rezultata u bazi
2.5. Statistika
Broj odigranih igara
Broj pobjeda i poraza
Win rate
2.6. Admin panel
Upravljanje korisnicima (dodavanje, brisanje, reset šifre)
Upravljanje riječima (dodavanje, brisanje, izmjena)
Upravljanje temama
Upravljanje jezicima


3. Ne-funkcionalni zahtevi
Implementacija u Rustu
SQL baza 
Modularna arhitektura
Pouzdanost i validacija unosa
Čuvanje podataka u bazi

4. Arhitektura sistema
4.1. Moduli
main – start programa, inicijalizacija
auth – registracija/prijava
game – logika igre (single player i multiplayer)
ui – terminalni meni i ASCII vješala
db – interakcija sa SQL bazom
admin – funkcionalnosti admin panela
stats – obrada i prikaz statistike
history – čuvanje i prikaz istorije igara

4.2. Baza podataka (SQL)
Tabela: korisnici | id | username | email | password_hash | role (user/admin) | created_at | wins | losses |
Tabela: riječi | id | riječ | tema | težina |
Tabela: history | id | user_id | protivnik_id (NULL za single) | riječ | greške | pobjeda | datum |
- ovo sa bazom je samo primjer neki, nije final.
