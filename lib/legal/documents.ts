import { siteConfig } from '../config';
import { VOLUME_TIERS } from '../pricing';
import { priceTaxInfo, processors, registryInfo, seller, sellerIdentity } from './seller';

export type Block = string | { list: string[]; ordered?: boolean };
export interface LegalSection {
  /** Kotwica w adresie, np. /regulamin#opinie */
  id?: string;
  title: string;
  blocks: Block[];
}
export interface LegalDoc {
  slug: string;
  title: string;
  description: string;
  sections: LegalSection[];
}

const shop = () => `Sklep internetowy ${siteConfig.name} dostępny pod adresem ${siteConfig.url}`;

/** Treść zgody zaznaczanej w koszyku — jedno źródło dla koszyka, e-maila i regulaminu. */
export const DIGITAL_CONSENT_TEXT =
  'Żądam dostarczenia treści cyfrowej przed upływem terminu do odstąpienia od umowy i przyjmuję do wiadomości, że po jej dostarczeniu utracę prawo odstąpienia od umowy.';

// ─────────────────────────────────────────────────────────────────────
//  REGULAMIN
// ─────────────────────────────────────────────────────────────────────
export function regulamin(): LegalDoc {
  return {
    slug: 'regulamin',
    title: 'Regulamin sklepu',
    description: 'Zasady zakupu i korzystania z gier detektywistycznych w formacie PDF.',
    sections: [
      {
        title: '§1. Postanowienia ogólne',
        blocks: [
          {
            ordered: true,
            list: [
              `${shop()} (dalej: „Sklep”) prowadzi ${sellerIdentity()} (dalej: „Sprzedawca”). ${registryInfo()}`,
              `Kontakt ze Sprzedawcą: e-mail ${seller.email}${seller.phone ? `, telefon ${seller.phone}` : ''}, formularz kontaktowy na stronie ${siteConfig.url}/kontakt lub pisemnie na adres podany w ust. 1.`,
              'Regulamin określa zasady zawierania umów sprzedaży treści cyfrowych za pośrednictwem Sklepu, prawa i obowiązki stron oraz tryb reklamacji. Regulamin jest udostępniany nieodpłatnie przed zawarciem umowy w sposób umożliwiający jego pobranie, utrwalenie i wydrukowanie.',
            ],
          },
        ],
      },
      {
        title: '§2. Definicje',
        blocks: [
          {
            list: [
              'Klient — osoba fizyczna, osoba prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, która korzysta ze Sklepu.',
              'Konsument — osoba fizyczna zawierająca ze Sprzedawcą umowę niezwiązaną bezpośrednio z jej działalnością gospodarczą lub zawodową.',
              'Przedsiębiorca na prawach konsumenta — osoba fizyczna zawierająca umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy z treści tej umowy wynika, że nie posiada ona dla niej charakteru zawodowego, wynikającego w szczególności z przedmiotu wykonywanej działalności, udostępnionego w CEIDG.',
              'Produkt — treść cyfrowa oferowana w Sklepie: fabularna gra detektywistyczna w jednej z dwóch wersji, wybieranej przy zakupie: (a) Wersja PDF — zestaw plików PDF przeznaczonych do pobrania i samodzielnego wydrukowania; (b) Wersja online — te same materiały sprawy udostępnione do przeglądania w przeglądarce, na Koncie Klienta, bez pobierania plików. Wersje są odrębnymi Produktami — zakup jednej nie obejmuje drugiej. Niektóre Produkty zawierają dodatkowo Nagrania.',
              'Nagrania — pliki audio lub wideo z fikcyjnymi przesłuchaniami postaci, dołączone do wybranych Produktów (w obu wersjach) i odtwarzane w przeglądarce na Koncie Klienta. Nagrania są wygenerowane z użyciem sztucznej inteligencji: głosy są syntetyczne, a postacie fikcyjne — informacja o tym jest podana przy Produkcie i przy odtwarzaczu.',
              'Konto — bezpłatna usługa elektroniczna umożliwiająca Klientowi składanie zamówień, przeglądanie historii zakupów, ponowne pobieranie zakupionych Produktów w Wersji PDF, przeglądanie zakupionych Produktów w Wersji online oraz odtwarzanie Nagrań.',
              'Operator płatności — Stripe Payments Europe, Ltd. z siedzibą w Dublinie (Irlandia), obsługujący płatności w Sklepie.',
            ],
          },
        ],
      },
      {
        title: '§3. Wymagania techniczne',
        blocks: [
          {
            ordered: true,
            list: [
              'Do korzystania ze Sklepu potrzebne są: urządzenie z dostępem do internetu, aktualna wersja przeglądarki (np. Chrome, Firefox, Safari, Edge) z włączoną obsługą JavaScript i plików cookies oraz aktywny adres e-mail.',
              'Do korzystania z Produktu w Wersji PDF potrzebny jest program do otwierania plików PDF (np. wbudowany w przeglądarkę). Do rozgrywki zalecana jest drukarka i papier formatu A4; druk w kolorze jest zalecany, ale nie jest konieczny.',
              'Do korzystania z Produktu w Wersji online oraz z Nagrań potrzebne są: dostęp do internetu, aktualna przeglądarka z włączoną obsługą JavaScript oraz zalogowanie na Konto. Zalecany jest ekran o szerokości co najmniej 360 px (telefon, tablet lub komputer), a do Nagrań — głośnik lub słuchawki.',
              'Zakazane jest dostarczanie przez Klienta treści o charakterze bezprawnym oraz podejmowanie działań zakłócających działanie Sklepu.',
            ],
          },
        ],
      },
      {
        title: '§4. Konto',
        blocks: [
          {
            ordered: true,
            list: [
              'Założenie Konta jest bezpłatne i wymaga podania adresu e-mail oraz hasła. Z chwilą założenia Konta zostaje zawarta umowa o jego prowadzenie na czas nieoznaczony.',
              'Zakup Produktu wymaga zalogowania się na Konto — zakupione Produkty są przypisywane do Konta.',
              'Klient może w każdej chwili, bez podawania przyczyny, zażądać usunięcia Konta, wysyłając wiadomość na adres e-mail Sprzedawcy. Usunięcie Konta oznacza utratę możliwości ponownego pobierania Produktów przez Sklep — przed usunięciem zalecamy zapisanie plików na własnym urządzeniu.',
              'Klient zobowiązuje się nie udostępniać danych logowania osobom trzecim.',
            ],
          },
        ],
      },
      {
        title: '§5. Zamówienia i zawarcie umowy',
        blocks: [
          {
            ordered: true,
            list: [
              'Informacje o Produktach w Sklepie stanowią zaproszenie do zawarcia umowy.',
              'Aby złożyć zamówienie, Klient dodaje Produkt do koszyka, loguje się na Konto, akceptuje Regulamin, składa oświadczenie, o którym mowa w §9 ust. 2, i klika przycisk „Zamawiam i płacę”, co oznacza obowiązek zapłaty.',
              'Umowa sprzedaży treści cyfrowej zostaje zawarta z chwilą złożenia zamówienia. Po zaksięgowaniu płatności Sprzedawca wysyła na adres e-mail Klienta potwierdzenie zawarcia umowy wraz z treścią Regulaminu i potwierdzeniem złożonego oświadczenia (trwały nośnik).',
            ],
          },
        ],
      },
      {
        title: '§6. Ceny i płatności',
        blocks: [
          {
            ordered: true,
            list: [
              `Ceny Produktów podane są w złotych polskich. ${priceTaxInfo()} Dostarczenie Produktu jest bezpłatne.`,
              'Płatności obsługuje Operator płatności. Dostępne metody (np. BLIK, szybki przelew, Przelewy24, karta płatnicza, Apple Pay, Google Pay) są prezentowane na stronie płatności.',
              'Na dokonanie płatności Klient ma 60 minut od złożenia zamówienia. Po tym czasie nieopłacone zamówienie zostaje anulowane.',
              'Na życzenie Klienta Sprzedawca wystawia rachunek (a na żądanie — fakturę bez VAT). Prośbę należy przesłać e-mailem, podając numer zamówienia i dane do dokumentu.',
            ],
          },
        ],
      },
      {
        title: '§7. Dostarczenie Produktu',
        blocks: [
          {
            ordered: true,
            list: [
              'Produkt jest dostarczany niezwłocznie po zaksięgowaniu płatności, poprzez udostępnienie plików do pobrania w zakładce „Moje sprawy” na Koncie Klienta. Produkt nie jest dostarczany na nośniku materialnym.',
              'Klient może pobierać zakupione pliki wielokrotnie przez cały okres istnienia Konta, nie krócej niż przez 2 lata od dnia zakupu.',
              'Produkt w Wersji online jest dostarczany poprzez udostępnienie przycisku „Otwórz akta online” przy sprawie w zakładce „Moje sprawy”. Dostęp przysługuje przez cały okres istnienia Konta, nie krócej niż przez 2 lata od dnia zakupu. Notatki Klienta są zapisywane na Koncie.',
              'Nagrania (jeśli Produkt je zawiera) są udostępniane do odtwarzania w zakładce „Moje sprawy” oraz w Wersji online przez cały okres istnienia Konta, nie krócej niż przez 2 lata od dnia zakupu. Nagrania nie są przeznaczone do pobierania.',
              'Sprzedawca może aktualizować treść Wersji online i Nagrań (np. poprawki błędów, lepsza jakość obrazu lub dźwięku), zachowując jej główną fabułę i funkcje. Aktualizacja nie wymaga zgody Klienta i nie wiąże się z dodatkowymi kosztami. Jeżeli aktualizacja istotnie i negatywnie wpływa na dostęp do Produktu lub korzystanie z niego, Klient może rozwiązać umowę w terminie 30 dni od jej wprowadzenia albo od poinformowania o niej, zgodnie z art. 43m ustawy o prawach konsumenta.',
              'Jeżeli pliki nie są dostępne w ciągu 24 godzin od płatności, Klient powinien skontaktować się ze Sprzedawcą.',
            ],
          },
        ],
      },
      {
        title: '§8. Licencja i prawa autorskie',
        blocks: [
          {
            ordered: true,
            list: [
              'Produkty są utworami chronionymi prawem autorskim. Z chwilą dostarczenia Produktu Klient otrzymuje niewyłączną, nieprzenoszalną i nieograniczoną w czasie licencję na korzystanie z Produktu do celów prywatnych.',
              'Licencja obejmuje: pobranie plików, zapisanie ich na własnych urządzeniach, drukowanie na własny użytek oraz rozgrywkę z domownikami i gośćmi przy wspólnej grze. W Wersji online i w zakresie Nagrań licencja obejmuje korzystanie na Koncie Klienta, także wspólnie z domownikami i gośćmi przy jednym ekranie.',
              'Licencja nie obejmuje: udostępniania danych logowania do Konta w celu korzystania z Wersji online przez osoby trzecie, kopiowania i rozpowszechniania materiałów z Wersji online (np. zrzutów ekranu stron) oraz Nagrań (np. nagrywania i publikowania dźwięku), odsprzedaży, udostępniania plików osobom trzecim (w tym w internecie), publicznego odtwarzania, wykorzystania komercyjnego (np. w płatnych wydarzeniach, escape roomach, szkoleniach) ani modyfikowania i rozpowszechniania Produktu bez pisemnej zgody Sprzedawcy.',
              'Wszystkie postacie, firmy, miejsca i wydarzenia przedstawione w Produktach są fikcyjne.',
              'Przy pobieraniu pliki są automatycznie oznaczane danymi Klienta (adres e-mail i numer zamówienia) umieszczonymi na marginesie stron. Oznaczenie służy ochronie przed nieuprawnionym rozpowszechnianiem i nie wpływa na możliwość korzystania z Produktu. Usuwanie oznaczeń jest zabronione.',
            ],
          },
        ],
      },
      {
        title: '§9. Odstąpienie od umowy',
        blocks: [
          {
            ordered: true,
            list: [
              'Co do zasady Konsument może odstąpić od umowy zawartej na odległość w terminie 14 dni bez podawania przyczyny.',
              `Zgodnie z art. 38 ust. 1 pkt 13 ustawy z dnia 30 maja 2014 r. o prawach konsumenta prawo odstąpienia nie przysługuje w odniesieniu do umowy o dostarczanie treści cyfrowych niedostarczanych na nośniku materialnym, za które Konsument jest zobowiązany do zapłaty ceny, jeżeli Sprzedawca rozpoczął świadczenie za wyraźną i uprzednią zgodą Konsumenta, który został poinformowany przed rozpoczęciem świadczenia, że po jego spełnieniu utraci prawo odstąpienia od umowy, i przyjął to do wiadomości, a Sprzedawca przekazał Konsumentowi potwierdzenie zawarcia umowy. W Sklepie zgoda ta jest wyrażana przed złożeniem zamówienia przez zaznaczenie pola o treści: „${DIGITAL_CONSENT_TEXT}”`,
              'Jeżeli Produkt nie został dostarczony (np. pliki nie zostały udostępnione na Koncie), Konsumentowi przysługuje prawo odstąpienia od umowy na zasadach ogólnych. Wzór formularza odstąpienia znajduje się na stronie „Zwroty i reklamacje”.',
              'Sprzedawca zwraca płatność niezwłocznie, nie później niż w terminie 14 dni, przy użyciu takiego samego sposobu płatności, jakiego użył Klient.',
            ],
          },
        ],
      },
      {
        title: '§10. Zgodność z umową i reklamacje',
        blocks: [
          {
            ordered: true,
            list: [
              'Sprzedawca odpowiada wobec Konsumenta za brak zgodności Produktu z umową istniejący w chwili jego dostarczenia i ujawniony w ciągu 2 lat od tej chwili, na zasadach określonych w rozdziale 5b ustawy o prawach konsumenta.',
              `Reklamację można złożyć e-mailem na adres ${seller.email} lub przez formularz kontaktowy. Reklamacja powinna zawierać: dane Klienta, numer zamówienia, opis problemu oraz żądanie. Wzór reklamacji znajduje się na stronie „Zwroty i reklamacje”.`,
              'Sprzedawca odpowiada na reklamację w terminie 14 dni od jej otrzymania. Brak odpowiedzi w tym terminie oznacza uznanie reklamacji.',
              'W przypadku braku zgodności z umową Konsument może żądać doprowadzenia Produktu do zgodności z umową (np. udostępnienia poprawionego pliku). Jeżeli doprowadzenie do zgodności jest niemożliwe, Sprzedawca nie zrobił tego w rozsądnym czasie lub brak zgodności jest istotny, Konsument może złożyć oświadczenie o obniżeniu ceny albo — gdy brak zgodności jest istotny — o odstąpieniu od umowy.',
              'Po odstąpieniu od umowy z powodu braku zgodności Konsument powinien powstrzymać się od korzystania z Produktu i udostępniania go osobom trzecim.',
            ],
          },
        ],
      },
      {
        title: '§11. Przedsiębiorcy',
        blocks: [
          {
            ordered: true,
            list: [
              'Postanowienia dotyczące Konsumenta, w szczególności w zakresie odstąpienia od umowy i odpowiedzialności za zgodność Produktu z umową, stosuje się także do Przedsiębiorcy na prawach konsumenta.',
              'Wobec Klientów niebędących Konsumentami ani Przedsiębiorcami na prawach konsumenta odpowiedzialność Sprzedawcy z tytułu rękojmi oraz za szkody jest wyłączona w najszerszym zakresie dopuszczalnym przez prawo, a jej górną granicą jest cena zapłacona za Produkt.',
            ],
          },
        ],
      },
      {
        title: '§12. Pozasądowe rozwiązywanie sporów',
        blocks: [
          'Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń, w szczególności z pomocy miejskiego lub powiatowego rzecznika konsumentów, wojewódzkiego inspektoratu Inspekcji Handlowej lub organizacji konsumenckich. Informacje dostępne są na stronie Urzędu Ochrony Konkurencji i Konsumentów (prawakonsumenta.uokik.gov.pl).',
        ],
      },
      {
        id: 'rabaty',
        title: '§13. Rabaty, pakiety i kody rabatowe',
        blocks: [
          {
            ordered: true,
            list: [
              `Rabat ilościowy: przy zakupie w jednym zamówieniu ${[...VOLUME_TIERS]
                .reverse()
                .map((t, i, arr) => `${t.minItems}${i === arr.length - 1 ? ' lub więcej' : ''} Produktów — cena łączna jest obniżana o ${t.percent}%`)
                .join('; ')}. Rabat jest naliczany automatycznie w koszyku.`,
              'Pakiety prezentowane w Sklepie to zestawy Produktów, które można dodać do koszyka jednym kliknięciem. Cena pakietu wynika z rabatu ilościowego, o którym mowa w ust. 1.',
              'Kod rabatowy uprawnia do obniżki na warunkach podanych przy jego udostępnieniu (wysokość, minimalna liczba Produktów, termin ważności, limit użyć). O ile warunki nie stanowią inaczej, kod może zostać wykorzystany przez Klienta jeden raz.',
              'Rabat ilościowy i kod rabatowy nie łączą się — w zamówieniu stosowany jest rabat korzystniejszy dla Klienta. Kodu nie można wymienić na gotówkę.',
              'Rabat jest rozliczany proporcjonalnie na wszystkie Produkty w zamówieniu. Cena ostateczna jest widoczna przed złożeniem zamówienia i w potwierdzeniu zamówienia.',
            ],
          },
        ],
      },
      {
        id: 'opinie',
        title: '§14. Opinie o Produktach',
        blocks: [
          {
            ordered: true,
            list: [
              'Opinię o Produkcie może dodać wyłącznie Klient, który kupił dany Produkt. Sprzedawca weryfikuje to automatycznie — formularz opinii jest dostępny tylko przy Produktach przypisanych do Konta na podstawie opłaconego zamówienia. Przy opublikowanej opinii widnieje oznaczenie „Zweryfikowany zakup”.',
              'Opinia zawiera ocenę w skali 1–5, treść oraz podpis wybrany przez autora. Sprzedawca nie zmienia treści opinii i nie płaci za ich wystawianie.',
              'Przed publikacją opinie są sprawdzane pod kątem zgodności z niniejszym paragrafem. Sprzedawca publikuje wszystkie opinie zgodne z Regulaminem — zarówno pozytywne, jak i negatywne.',
              'Sprzedawca może odmówić publikacji lub usunąć opinię, która: zdradza rozwiązanie sprawy, zawiera wulgaryzmy, treści obraźliwe lub bezprawne, dane osobowe osób trzecich, reklamy lub linki albo nie dotyczy Produktu. O odmowie autor jest informowany w zakładce „Moje sprawy”.',
              'Autor może w każdej chwili edytować lub usunąć swoją opinię (usunięcie — na prośbę e-mailową). Edytowana opinia ponownie przechodzi weryfikację.',
            ],
          },
        ],
      },
      {
        id: 'newsletter',
        title: '§15. Newsletter i darmowa sprawa próbna',
        blocks: [
          {
            ordered: true,
            list: [
              'Newsletter to nieodpłatna usługa elektroniczna polegająca na przesyłaniu na podany adres e-mail informacji o nowych sprawach, promocjach i kodach rabatowych, nie częściej niż kilka razy w miesiącu.',
              'Zapis wymaga podania adresu e-mail, wyrażenia zgody na otrzymywanie newslettera i potwierdzenia zapisu linkiem wysłanym na ten adres.',
              'Po potwierdzeniu zapisu Subskrybent otrzymuje nieodpłatnie dostęp do sprawy próbnej AKTA #000 w formacie PDF, na zasadach licencji opisanej w §8.',
              'Subskrybent może w każdej chwili, bez podawania przyczyny i bez kosztów, zrezygnować z newslettera, klikając link „Wypisz się” w każdej wiadomości lub pisząc do Sprzedawcy. Rezygnacja nie wpływa na dostęp do już pobranej sprawy próbnej.',
            ],
          },
        ],
      },
      {
        title: '§16. Dane osobowe',
        blocks: [`Zasady przetwarzania danych osobowych opisuje Polityka prywatności dostępna pod adresem ${siteConfig.url}/polityka-prywatnosci.`],
      },
      {
        title: '§17. Postanowienia końcowe',
        blocks: [
          {
            ordered: true,
            list: [
              'Sprzedawca może zmienić Regulamin z ważnych przyczyn (np. zmiana przepisów, zmiana metod płatności). Zmiany nie dotyczą umów zawartych przed ich wejściem w życie. O zmianie Regulaminu Klienci posiadający Konto zostaną poinformowani e-mailem z co najmniej 14-dniowym wyprzedzeniem.',
              'W sprawach nieuregulowanych stosuje się prawo polskie. Wybór prawa polskiego nie pozbawia Konsumenta ochrony przysługującej mu na podstawie bezwzględnie obowiązujących przepisów prawa państwa jego zwykłego pobytu.',
              `Regulamin obowiązuje od dnia ${seller.effectiveDate}`,
            ],
          },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────
//  POLITYKA PRYWATNOŚCI
// ─────────────────────────────────────────────────────────────────────
export function politykaPrywatnosci(): LegalDoc {
  return {
    slug: 'polityka-prywatnosci',
    title: 'Polityka prywatności',
    description: 'Jak przetwarzamy dane osobowe w sklepie.',
    sections: [
      {
        title: '1. Administrator danych',
        blocks: [
          `Administratorem danych osobowych jest ${sellerIdentity()} (dalej: „Administrator”). Kontakt w sprawach danych osobowych: ${seller.email}. Administrator nie wyznaczył inspektora ochrony danych.`,
        ],
      },
      {
        title: '2. Jakie dane i w jakim celu przetwarzamy',
        blocks: [
          {
            list: [
              'Konto — adres e-mail, hasło (w formie zaszyfrowanej), imię (opcjonalnie): w celu założenia i prowadzenia Konta (art. 6 ust. 1 lit. b RODO).',
              'Zamówienia — adres e-mail, historia zamówień, zakupione Produkty, data i treść oświadczeń złożonych przy zakupie: w celu zawarcia i wykonania umowy oraz dostarczenia Produktu (art. 6 ust. 1 lit. b RODO).',
              'Płatności — identyfikator transakcji i jej status. Dane karty lub rachunku bankowego przetwarza wyłącznie Operator płatności (Stripe) — Administrator nie ma do nich dostępu.',
              'Rozliczenia — dane z zamówień i faktur: w celu wypełnienia obowiązków podatkowych i rachunkowych (art. 6 ust. 1 lit. c RODO).',
              'Reklamacje i odstąpienia — dane podane w zgłoszeniu: w celu ich rozpatrzenia (art. 6 ust. 1 lit. b i c RODO).',
              'Kontakt — imię, adres e-mail i treść wiadomości z formularza kontaktowego: w celu udzielenia odpowiedzi (art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes).',
              'Newsletter i sprawa próbna — adres e-mail, data i treść zgody, data potwierdzenia: w celu wysyłania newslettera (art. 6 ust. 1 lit. a RODO — zgoda) oraz udostępnienia darmowej sprawy (art. 6 ust. 1 lit. b RODO). Zgodę możesz wycofać w każdej chwili linkiem „Wypisz się”. Po wypisaniu przechowujemy informację o udzieleniu i wycofaniu zgody w celu wykazania zgodności z prawem (art. 6 ust. 1 lit. f RODO).',
              'Opinie — ocena, treść opinii, wybrany podpis i powiązanie z zakupem: w celu publikacji opinii i weryfikacji, że pochodzą od kupujących (art. 6 ust. 1 lit. f RODO; publicznie widoczne są tylko ocena, treść, podpis i data).',
              'Oznaczenie plików — adres e-mail i numer zamówienia umieszczane na marginesie pobieranych plików PDF: w celu ochrony praw autorskich przed nieuprawnionym rozpowszechnianiem (art. 6 ust. 1 lit. f RODO).',
              'Wersja online — notatki wpisane w czytniku oraz data otwarcia koperty z rozwiązaniem: w celu zapisania ich na Koncie (art. 6 ust. 1 lit. b RODO). Na stronach akt wyświetlany jest adres e-mail Klienta w celu ochrony praw autorskich (art. 6 ust. 1 lit. f RODO).',
              'Statystyki odwiedzin — dane o korzystaniu ze strony zbierane przez Google Analytics (identyfikatory cookies, przybliżona lokalizacja, typ urządzenia, odwiedzone podstrony): w celu analizy ruchu i ulepszania Sklepu — wyłącznie na podstawie zgody (art. 6 ust. 1 lit. a RODO).',
              'Marketing — dane o wizytach i zakupach przekazywane do Meta (Piksel Meta): w celu mierzenia skuteczności reklam na Facebooku i Instagramie oraz docierania z reklamą do osób, które odwiedziły Sklep — wyłącznie na podstawie zgody (art. 6 ust. 1 lit. a RODO). Meta Platforms Ireland Ltd. jest w tym zakresie współadministratorem danych.',
              'Bezpieczeństwo i roszczenia — logi techniczne (np. adres IP, czas pobrania pliku): w celu zapewnienia bezpieczeństwa Sklepu, zapobiegania nadużyciom oraz ustalenia, dochodzenia lub obrony roszczeń (art. 6 ust. 1 lit. f RODO).',
            ],
          },
          'Podanie danych jest dobrowolne, ale niezbędne do założenia Konta i złożenia zamówienia. Zgodę na cookies analityczne i marketingowe możesz w każdej chwili wycofać w „Ustawieniach cookies” (link w stopce) — nie wpływa to na zgodność z prawem przetwarzania przed jej wycofaniem. Nie podejmujemy wobec ciebie decyzji wywołujących skutki prawne w sposób zautomatyzowany.',
        ],
      },
      {
        title: '3. Jak długo przechowujemy dane',
        blocks: [
          {
            list: [
              'Dane Konta — do czasu usunięcia Konta.',
              'Dane zamówień i dokumenty rozliczeniowe — przez 5 lat od końca roku kalendarzowego, w którym upłynął termin płatności podatku (wymogi przepisów podatkowych).',
              'Dane związane z reklamacjami i roszczeniami — do upływu terminu przedawnienia roszczeń.',
              'Wiadomości z formularza kontaktowego — do 12 miesięcy od zakończenia korespondencji.',
              'Newsletter — do wypisania się; niepotwierdzone zapisy usuwamy po 30 dniach; dowód zgody i jej wycofania — do upływu terminu przedawnienia roszczeń.',
              'Opinie — do czasu usunięcia opinii lub Konta.',
              'Notatki z Wersji online — do czasu usunięcia Konta.',
              'Dane z Google Analytics — 14 miesięcy; dane z Piksela Meta — zgodnie z zasadami Meta, nie dłużej niż 2 lata; w każdym przypadku do wycofania zgody.',
            ],
          },
        ],
      },
      {
        title: '4. Odbiorcy danych',
        blocks: [
          'Dane mogą być przekazywane podmiotom, które pomagają nam prowadzić Sklep, wyłącznie w zakresie niezbędnym do wykonania ich usług:',
          {
            list: [
              ...processors.map((p) => `${p.name} — ${p.role}; lokalizacja: ${p.location}.`),
              ...(seller.accountingOffice ? [`${seller.accountingOffice} — obsługa księgowa.`] : []),
            ],
          },
          'Przekazanie danych poza Europejski Obszar Gospodarczy odbywa się wyłącznie na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony (EU-US Data Privacy Framework) lub standardowych klauzul umownych zatwierdzonych przez Komisję Europejską. Kopię zabezpieczeń można uzyskać, kontaktując się z Administratorem.',
          'Nie sprzedajemy danych osobowych i nie udostępniamy ich w celach marketingowych.',
        ],
      },
      {
        title: '5. Twoje prawa',
        blocks: [
          'Przysługuje ci prawo do: dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania opartego na prawnie uzasadnionym interesie. Aby skorzystać z tych praw, napisz do nas.',
          'Masz także prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).',
        ],
      },
      {
        title: '6. Pliki cookies',
        blocks: [`Sklep używa niezbędnych plików cookies oraz — po wyrażeniu zgody — cookies analitycznych i marketingowych. Szczegóły: ${siteConfig.url}/polityka-cookies.`],
      },
      {
        title: '7. Zmiany polityki',
        blocks: [`Polityka prywatności obowiązuje od dnia ${seller.effectiveDate} O istotnych zmianach poinformujemy na stronie Sklepu.`],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────
//  POLITYKA COOKIES
// ─────────────────────────────────────────────────────────────────────
export function politykaCookies(): LegalDoc {
  return {
    slug: 'polityka-cookies',
    title: 'Polityka cookies',
    description: 'Jakie pliki cookies stosujemy, w jakim celu i jak zarządzać zgodą.',
    sections: [
      {
        title: '1. Czym są pliki cookies',
        blocks: ['Pliki cookies to niewielkie pliki tekstowe zapisywane na twoim urządzeniu przez przeglądarkę. Podobną funkcję pełni pamięć lokalna przeglądarki (localStorage).'],
      },
      {
        title: '2. Pliki niezbędne (zawsze aktywne)',
        blocks: [
          {
            list: [
              'Cookies sesji logowania (nazwy zaczynające się od „sb-”) — utrzymują zalogowanie na Koncie i chronią przed nieuprawnionym dostępem. Usuwane po wylogowaniu lub wygaśnięciu sesji.',
              'Pamięć lokalna przeglądarki: „akta-koszyk-v1” (zawartość koszyka) i „akta-zgody-v1” (twoje wybory dotyczące cookies).',
              'Operator płatności Stripe używa własnych cookies na stronie płatności (checkout.stripe.com) — zgodnie z polityką prywatności Stripe.',
            ],
          },
          'Na te pliki zgoda nie jest wymagana, bo są niezbędne do świadczenia usługi, o którą prosisz (art. 399 ust. 3 ustawy – Prawo komunikacji elektronicznej).',
        ],
      },
      {
        title: '3. Pliki analityczne (tylko za zgodą)',
        blocks: [
          'Google Analytics 4 (Google Ireland Ltd.) — cookies „_ga” i „_ga_*”, ważne do 14 miesięcy. Pomagają nam zrozumieć, jak korzystasz ze strony (które podstrony odwiedzasz, skąd przychodzisz), abyśmy mogli ją ulepszać. Adresy IP nie są przechowywane przez Google Analytics 4.',
        ],
      },
      {
        title: '4. Pliki marketingowe (tylko za zgodą)',
        blocks: [
          'Piksel Meta (Meta Platforms Ireland Ltd.) — cookie „_fbp”, ważne do 90 dni. Pozwala mierzyć skuteczność reklam na Facebooku i Instagramie (np. czy reklama doprowadziła do zakupu) i pokazywać reklamy osobom, które odwiedziły Sklep.',
        ],
      },
      {
        title: '5. Jak zarządzać zgodą',
        blocks: [
          'Przy pierwszej wizycie wyświetlamy baner, w którym możesz zaakceptować wszystkie pliki, odrzucić pliki opcjonalne albo wybrać kategorie. Do czasu wyrażenia zgody skrypty Google Analytics i Meta nie są ładowane.',
          'Swój wybór możesz w każdej chwili zmienić lub wycofać przez link „Ustawienia cookies” w stopce strony. Możesz też usunąć cookies w ustawieniach przeglądarki.',
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────
//  ZWROTY I REKLAMACJE
// ─────────────────────────────────────────────────────────────────────
export function zwroty(): LegalDoc {
  return {
    slug: 'zwroty-i-reklamacje',
    title: 'Zwroty i reklamacje',
    description: 'Jak zgłosić problem z zakupioną sprawą i kiedy przysługuje zwrot.',
    sections: [
      {
        title: 'W skrócie',
        blocks: [
          {
            list: [
              'Nasze produkty to pliki PDF dostarczane od razu po płatności. Przy zakupie wyrażasz zgodę na natychmiastowe dostarczenie, dlatego po udostępnieniu plików nie przysługuje prawo odstąpienia od umowy (art. 38 ust. 1 pkt 13 ustawy o prawach konsumenta).',
              'Jeśli plik jest uszkodzony, nie da się go pobrać lub coś jest nie tak z treścią — złóż reklamację. Odpowiemy w ciągu 14 dni, zwykle znacznie szybciej.',
              'Jeśli zapłaciłeś, a pliki nie pojawiły się na koncie — możesz odstąpić od umowy i otrzymasz pełny zwrot.',
            ],
          },
        ],
      },
      {
        title: 'Jak złożyć reklamację',
        blocks: [
          `Napisz na ${seller.email} lub przez formularz kontaktowy. Możesz skorzystać z poniższego wzoru:`,
          {
            list: [
              'Imię i nazwisko: …',
              'Adres e-mail użyty przy zakupie: …',
              'Numer zamówienia: …',
              'Data zakupu: …',
              'Opis problemu (np. który plik, co nie działa): …',
              'Moje żądanie: doprowadzenie do zgodności z umową (np. przesłanie poprawionego pliku) / obniżenie ceny / odstąpienie od umowy',
            ],
          },
          'Po odstąpieniu od umowy z powodu wady zwracamy pieniądze w ciągu 14 dni, tą samą metodą płatności.',
        ],
      },
      {
        title: 'Wzór formularza odstąpienia od umowy',
        blocks: [
          '(Formularz należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy, gdy prawo to przysługuje — np. gdy produkt nie został dostarczony.)',
          {
            list: [
              `Adresat: ${seller.name}, ${seller.address}, e-mail: ${seller.email}`,
              'Ja/My(*) niniejszym informuję/informujemy(*) o moim/naszym odstąpieniu od umowy dostarczania następującej treści cyfrowej: …',
              'Data zawarcia umowy / numer zamówienia: …',
              'Imię i nazwisko konsumenta(-ów): …',
              'Adres konsumenta(-ów): …',
              'Podpis konsumenta(-ów) (tylko jeżeli formularz jest przesyłany w wersji papierowej): …',
              'Data: …',
              '(*) Niepotrzebne skreślić.',
            ],
          },
        ],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────
//  NOTA PRAWNA
// ─────────────────────────────────────────────────────────────────────
export function notaPrawna(): LegalDoc {
  return {
    slug: 'nota-prawna',
    title: 'Nota prawna',
    description: 'Informacje o właścicielu serwisu, prawach autorskich i odpowiedzialności.',
    sections: [
      {
        title: 'Właściciel serwisu',
        blocks: [
          `Serwis ${siteConfig.url} prowadzi ${sellerIdentity()}. ${registryInfo()}`,
          `Kontakt: ${seller.email}${seller.phone ? `, tel. ${seller.phone}` : ''}.`,
        ],
      },
      {
        title: 'Prawa autorskie',
        blocks: [
          `Wszystkie treści publikowane w serwisie i sprzedawane w Sklepie — w szczególności scenariusze spraw, teksty, dokumenty, grafiki, szkice, układ graficzny oraz znak „${siteConfig.name}” — są chronione prawem autorskim (ustawa z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych) i należą do Sprzedawcy lub są wykorzystywane na podstawie licencji.`,
          'Kopiowanie, rozpowszechnianie, odsprzedaż lub publiczne udostępnianie materiałów bez pisemnej zgody jest zabronione, z wyjątkiem korzystania w granicach licencji opisanej w Regulaminie i dozwolonego użytku.',
        ],
      },
      {
        title: 'Fikcja',
        blocks: [
          'Wszystkie postacie, firmy, hotele, instytucje, miejsca i wydarzenia przedstawione w sprawach są fikcyjne. Jakiekolwiek podobieństwo do rzeczywistych osób, żywych lub zmarłych, podmiotów lub zdarzeń jest przypadkowe. Dokumenty w grach (raporty, protokoły, pieczęcie) są elementem rozrywki i nie są dokumentami urzędowymi.',
          'Zdjęcia postaci oraz nagrania przesłuchań w sprawach zostały wygenerowane z użyciem sztucznej inteligencji. Przedstawione twarze i głosy są syntetyczne i nie należą do żadnych rzeczywistych osób.',
        ],
      },
      {
        title: 'Odpowiedzialność',
        blocks: [
          'Dokładamy starań, aby informacje w serwisie były aktualne i poprawne. Serwis może zawierać odnośniki do stron zewnętrznych (np. operatora płatności), za których treść nie odpowiadamy.',
          'Gry przeznaczone są dla osób dorosłych i młodzieży od 16 lat — dotyczą fikcyjnych przestępstw, bez drastycznych opisów. Wyjątkiem są sprawy z działu „Dla całej rodziny”, oznaczone jako odpowiednie od 12 lat (tak jak darmowa sprawa próbna).',
        ],
      },
    ],
  };
}

export const legalDocs = {
  regulamin,
  'polityka-prywatnosci': politykaPrywatnosci,
  'polityka-cookies': politykaCookies,
  'zwroty-i-reklamacje': zwroty,
  'nota-prawna': notaPrawna,
};
