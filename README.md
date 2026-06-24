# Online Library
Online Library je web aplikacija za upravljanje osobnom knjižnicom. Omogućava laku i učinkovitu evidenciju knjiga koje posjedujete i planirate pročitati. Jedna od ključnih značajki Online Library aplikacije je praćenje statusa čitanja — za svaku knjigu se može označiti je li pročitana ili ne. Aplikacija pruža mogućnost dodavanja novih knjiga, uređivanja postojećih te brisanja onih koje više ne želiš pratiti. Online Library nudi i pregled svih knjiga s podatcima kao što su naslov, autor, godina izdanja, jezik i žanr.



## Usecase dijagram
<img width="1120" height="1260" alt="Blank diagram" src="https://github.com/user-attachments/assets/016a2f29-25ff-4680-98c8-6bc440afbf96" />



## Pokretanje s Dockerom
  ### 1. Kloniraj repozitorij
    git clone https://github.com/username/online-library.git
    cd online-library
  
  ### 2. Build Docker image
    docker build -t online-library .
  
  ### 3. Pokreni kontejner
    docker run -d -p 80:80 -p 5000:5000 --name library online-library
  
