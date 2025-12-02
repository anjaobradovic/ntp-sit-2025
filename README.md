# ntp-sit-2025

Hangman+ (Rust projekat)
1. Uvod
Ovaj projekat predstavlja implementaciju igre Hangman+ u programskom jeziku Rust. Igra je terminalna aplikacija koja omogućava korisnicima da se registruju, prijave, biraju teme i nivoe težine, igraju protiv kompjutera ili drugog korisnika, i prate statistiku svojih igara. Takođe, postoji admin panel za upravljanje korisnicima, riječima, temama i achievementima. Cilj projekta je demonstracija sposobnosti upravljanja korisnicima, bazom podataka, višemodularnog programiranja i implementacije logike igre u Rustu.

2. Funkcionalni zahtevi
2.1. Korisnički nalozi
Registracija: username, email, password (hashiran)
Prijava: autentikacija korisnika
Evidencija statistike (pobjede, porazi)
2.2. Početna stranica (Terminal UI)
Meni:
Play single player
Play multiplayer
Stats
Settings
Logout
(Admin) Admin panel
2.3. Single Player
Izbor teme (Animals, Movies, Geography...)
Izbor nivoa težine (Easy / Medium / Hard)
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
2.4. Multiplayer (offline)
Runda 1: Igrač 1 unosi riječ, Igrač 2 pogađa
Runda 2: Igrač 2 unosi riječ, Igrač 1 pogađa
Pobjednik je onaj sa manje nacrtanih dijelova tijela
Evidencija rezultata u bazi
2.5. Statistika
Broj odigranih igara
Broj pobjeda i poraza
Win rate
Prosječan broj grešaka
2.6. Admin panel
Upravljanje korisnicima (dodavanje, brisanje, reset šifre)
Upravljanje riječima (dodavanje, brisanje, izmjena)
Upravljanje temama

3. Ne-funkcionalni zahtevi
Implementacija u Rustu
SQL baza 
Terminal UI
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
