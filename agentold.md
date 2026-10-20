# agent.md — onepagecmspush

> Note operative per Claude. Leggere prima di lavorare su questo progetto.

---

## Cos'e

Fork/copia 1:1 di `cmspush` (stesso codice, stessa struttura Jekyll + CMS admin).
Obiettivo finale: trasformarlo in un CMS per **one-page editabile** con pochi prodotti
(landing tipo mini-shop), partendo dalla base funzionante di cmspush.

**Stato attuale:** copia identica, non ancora differenziato. Nessuna modifica one-page fatta finora.

---

## Link

- Repo: https://github.com/cialdecompatibili-netizen/onepagecmspush
- Sito live: https://cialdecompatibili-netizen.github.io/onepagecmspush/
- Admin: https://cialdecompatibili-netizen.github.io/onepagecmspush/admin/
- Locale: C:\Users\mirco\Desktop\repository\onepagecmspush
- Branch: main
- Remote: origin (token gia nell'URL remoto, niente credenziali da chiedere)

---

## Automazioni attive

### 1. Notifica sonora - SEMPRE
Ad ogni fine risposta (ultima azione) o se serve input dall'utente:
1. tool_search query "sound notification"
2. sound-notification:send_notification (title: "Claude OK", message: "Task completato!")
Nessuna eccezione, anche per task piccoli.

### 2. Push GitHub - autonomo
Claude pusha da solo senza aspettare conferma, usando PowerShell:
cd "C:\Users\mirco\Desktop\repository\onepagecmspush"; git add .; git commit -m "descrizione"; git push
Se push rejected (fetch first) - SEMPRE:
git pull --rebase; git push

### 3. Token GitHub - gia disponibile
Il token e incorporato nel remote URL di cmspush (repo sorgente). Per operazioni API
(creazione repo, Pages, ecc.) si estrae cosi, senza chiedere a Mirco:
$token = (git -C "C:\Users\mirco\Desktop\repository\cmspush" remote get-url origin) -replace '.*ghp_([A-Za-z0-9]+)@.*','ghp_$1'

### 4. GitHub Pages
Attivato su branch main, root (/). Build automatica ad ogni push (1-2 min).

---

## REGOLA D'ORO - TOKEN SCARSI

Sessione con budget token limitato. Regole non negoziabili:

1. MAI riscrivere file interi - solo edit chirurgici (edit_block / str_replace) con minimo contesto (3-5 righe)
2. MAI rileggere file gia letti in sessione senza motivo
3. Copiare/spostare con PowerShell invece di leggere+riscrivere via tool
4. Operazioni bulk via comando singolo (robocopy, git) invece di tool-per-file
5. Niente spiegazioni verbose - ragiona, poi agisci
6. In caso di dubbio su modifica rischiosa - chiedi prima, non improvvisare

---

## Log sessioni

| Data | Cosa fatto |
|------|-----------|
| 2026-06-18 | Creata repo GitHub onepagecmspush (pubblica). Copiata cartella locale da cmspush (72 file, robocopy, escluso .git). Init git nuovo, commit iniziale, push su main. GitHub Pages attivato (root, branch main). Creato questo agent.md. |

---

## Prossimo step

Decidere e implementare la differenziazione da cmspush verso one-page:
- Quanti prodotti (hardcoded o via _products/ come cmspush?)
- Admin: riuso intero o ridotto a solo hero+prodotti+sezioni?
- Vedi conversazione con Mirco per decisioni pendenti su questi punti.

---

## File da NON toccare senza motivo

- cmspush.rar, cmspushx.rar - archivi storici, ininfluenti
- _posts/* - post demo ereditati da cmspush, da svuotare quando si differenzia il progetto
- wb.ps1, wb2.ps1 - script storici di cmspush, verificare se servono ancora qui prima di eliminarli

---

## Strumento da usare SEMPRE

Per ogni operazione sul PC di Mirco (file, cartelle, git, PowerShell) usare SEMPRE
Windows-MCP:PowerShell. Non usare altri tool filesystem (Filesystem:*, filesystem:*)
per leggere/scrivere/copiare su questo progetto - solo PowerShell diretto.

---

## REGOLA: zero valori hardcoded nel codice

Qualsiasi path, URL, baseurl o testo che possa cambiare da repo a repo (o che l'utente
potrebbe voler modificare) NON va scritto a mano nel codice. Va invece:

1. Generato dinamicamente (Liquid `relative_url`, JS `site.baseurl`, `detectRepo()`)
2. Oppure reso configurabile dalla UI dell'admin (tab Impostazioni/Tema/Integrazioni),
   letto/scritto via GitHub API come fa già il resto del CMS

Esempio errore gia corretto: `var BASE = '/cmspush'` in _includes/head/custom.html
era hardcoded -> ora `var BASE = '{{ site.baseurl }}'`.

Prima di pushare qualsiasi nuova feature, controllare con:
Select-String -Path "_pages\*.md","_layouts\*.html","_includes\*.html" -Pattern '/cmspush|/onepagecmspush'
Se compaiono path fissi del nome repo -> vanno resi dinamici o spostati in admin.
