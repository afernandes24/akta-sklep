/**
 * Współrzędne większych polskich miast — zapasowe, gdy wpis w statystykach nie ma
 * szerokości/długości z Cloudflare (np. dane sprzed ich zapisywania).
 */
const CITIES: Record<string, [number, number]> = {
  Warszawa: [52.23, 21.01], Kraków: [50.06, 19.94], Łódź: [51.76, 19.46], Wrocław: [51.11, 17.03], Poznań: [52.41, 16.93],
  Gdańsk: [54.35, 18.65], Gdynia: [54.52, 18.53], Sopot: [54.44, 18.56], Szczecin: [53.43, 14.55], Bydgoszcz: [53.12, 18.01],
  Lublin: [51.25, 22.57], Białystok: [53.13, 23.16], Katowice: [50.26, 19.02], Gliwice: [50.29, 18.67], Zabrze: [50.32, 18.79],
  Bytom: [50.35, 18.92], Sosnowiec: [50.29, 19.10], Chorzów: [50.30, 18.95], Tychy: [50.12, 18.99], 'Ruda Śląska': [50.26, 18.86],
  Rybnik: [50.10, 18.55], 'Dąbrowa Górnicza': [50.32, 19.19], 'Bielsko-Biała': [49.82, 19.04], Częstochowa: [50.81, 19.12],
  Kielce: [50.87, 20.63], Rzeszów: [50.04, 22.00], Olsztyn: [53.78, 20.49], Opole: [50.68, 17.93], Toruń: [53.01, 18.60],
  'Gorzów Wielkopolski': [52.73, 15.24], 'Zielona Góra': [51.94, 15.51], Radom: [51.40, 21.15], Płock: [52.55, 19.71],
  Elbląg: [54.16, 19.40], Koszalin: [54.19, 16.17], Słupsk: [54.46, 17.03], Kalisz: [51.76, 18.09], Legnica: [51.21, 16.16],
  Wałbrzych: [50.78, 16.28], 'Jelenia Góra': [50.90, 15.73], Tarnów: [50.01, 20.99], 'Nowy Sącz': [49.62, 20.69], Przemyśl: [49.78, 22.77],
  Siedlce: [52.17, 22.29], Łomża: [53.18, 22.06], Suwałki: [54.10, 22.93], Ełk: [53.83, 22.36], Piła: [53.15, 16.74],
  Konin: [52.22, 18.25], Leszno: [51.84, 16.57], Gniezno: [52.54, 17.60], Włocławek: [52.65, 19.07], Grudziądz: [53.48, 18.75],
  Inowrocław: [52.80, 18.26], Piotrków: [51.41, 19.70], 'Piotrków Trybunalski': [51.41, 19.70], Skierniewice: [51.95, 20.16],
  Pabianice: [51.66, 19.35], Zamość: [50.72, 23.25], 'Chełm': [51.14, 23.47], 'Biała Podlaska': [52.03, 23.12], Puławy: [51.42, 21.97],
  Ostrołęka: [53.08, 21.57], Ciechanów: [52.88, 20.62], Pruszków: [52.17, 20.80], Legionowo: [52.40, 20.93], Piaseczno: [52.08, 21.02],
  Otwock: [52.11, 21.26], 'Mińsk Mazowiecki': [52.18, 21.56], 'Stalowa Wola': [50.58, 22.05], Mielec: [50.29, 21.42], Krosno: [49.69, 21.77],
  Sanok: [49.56, 22.20], Zakopane: [49.30, 19.95], 'Nowy Targ': [49.48, 20.03], Oświęcim: [50.04, 19.22], Wieliczka: [49.99, 20.06],
  Jaworzno: [50.20, 19.27], Jastrzębie: [49.95, 18.59], 'Jastrzębie-Zdrój': [49.95, 18.59], Żory: [50.04, 18.70], Racibórz: [50.09, 18.22],
  Kędzierzyn: [50.35, 18.21], 'Kędzierzyn-Koźle': [50.35, 18.21], Nysa: [50.47, 17.33], Świdnica: [50.84, 16.49], Lubin: [51.40, 16.20],
  Głogów: [51.66, 16.08], Bolesławiec: [51.26, 15.57], 'Ostrów Wielkopolski': [51.65, 17.81], Tczew: [54.09, 18.78], Wejherowo: [54.61, 18.24],
  Rumia: [54.57, 18.39], Reda: [54.60, 18.35], Pruszcz: [54.26, 18.64], 'Pruszcz Gdański': [54.26, 18.64], Starogard: [53.97, 18.53],
  'Starogard Gdański': [53.97, 18.53], Malbork: [54.04, 19.03], Kwidzyn: [53.73, 18.93], Chojnice: [53.70, 17.56], Lębork: [54.54, 17.75],
  Kartuzy: [54.33, 18.20], Kościerzyna: [54.12, 17.98], Puck: [54.72, 18.41], Hel: [54.61, 18.80], Władysławowo: [54.79, 18.40],
  Stargard: [53.34, 15.05], Świnoujście: [53.91, 14.25], Kołobrzeg: [54.18, 15.58], Szczecinek: [53.71, 16.70], Ostróda: [53.70, 19.96],
  Iława: [53.60, 19.57], Giżycko: [54.04, 21.76], Mrągowo: [53.86, 21.30], Augustów: [53.84, 22.98], Zgierz: [51.86, 19.41],
  Bełchatów: [51.37, 19.36], Tomaszów: [51.53, 20.01], 'Tomaszów Mazowiecki': [51.53, 20.01], Sieradz: [51.60, 18.73], Ostrowiec: [50.93, 21.39],
  'Ostrowiec Świętokrzyski': [50.93, 21.39], Starachowice: [51.04, 21.07], Skarżysko: [51.12, 20.87], 'Skarżysko-Kamienna': [51.12, 20.87],
  Sandomierz: [50.68, 21.75], Brzeg: [50.86, 17.47], Żary: [51.64, 15.14], Żagań: [51.62, 15.32], Kraśnik: [50.92, 22.22], Świdnik: [51.22, 22.70],
};

const norm = (s: string) => s.toLowerCase().normalize('NFC').trim();
const INDEX = new Map(Object.entries(CITIES).map(([k, v]) => [norm(k), v]));

export function cityCoords(name: string | null | undefined): [number, number] | null {
  if (!name) return null;
  return INDEX.get(norm(name)) ?? null;
}
