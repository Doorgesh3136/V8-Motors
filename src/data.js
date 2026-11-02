// Replace these with the real dealership details before going live.
export const DEALER = {
  name: 'V8 Motors',
  phone: '+230 5 800 0808',
  phoneHref: 'tel:+23058000808',
  whatsapp: '23058000808',
  email: 'hello@v8motors.mu',
  address: 'Royal Road, Beau Bassin, Mauritius',
  mapsQuery: 'Royal Road Beau Bassin Mauritius',
  timeZone: 'Indian/Mauritius',
  // index 0 = Sunday … 6 = Saturday; null = closed
  hours: [null, ['08:30', '17:30'], ['08:30', '17:30'], ['08:30', '17:30'], ['08:30', '17:30'], ['08:30', '17:30'], ['08:30', '15:00']],
  financeRate: 6.9,
};

export const FEATURED = {
  title: 'Ferrari 458 Italia',
  year: 2014,
  specs: [['Engine', '4.5 L V8'], ['Power', '570 hp'], ['0–100 km/h', '3.4 s'], ['Mileage', '21,400 km']],
  price: 11900000,
};

export const PAINTS = [
  { name: 'Redline', hex: '#a3150f' },
  { name: 'Lagoon', hex: '#0d5961' },
  { name: 'Basalt', hex: '#2b2e33' },
  { name: 'Pearl', hex: '#e6e4df' },
  { name: 'Saffron', hex: '#d39a1c' },
];

export const BODY_TYPES = ['Hatchback', 'Sedan', 'SUV', 'Coupe', 'Convertible', 'Pickup'];
export const FUELS = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

export const img = (path, w = 1400) => `https://images.unsplash.com/${path}?auto=format&fit=crop&w=${w}&q=72`;
export const sized = (url, w) => url.replace(/w=\d+/, `w=${w}`);

const SEATS = { Hatchback: 5, Sedan: 5, SUV: 5, Coupe: 2, Convertible: 2, Pickup: 5 };

const FEATURE_SETS = {
  base: ['Air conditioning', 'Bluetooth audio', 'Reversing camera', 'Cruise control', 'Electric windows', 'Remote central locking'],
  mid: ['Apple CarPlay and Android Auto', 'Keyless entry', 'Parking sensors front and rear', 'Dual-zone climate control', 'LED headlights', 'Alloy wheels'],
  high: ['Leather seats', 'Heated and ventilated front seats', 'Premium sound system', 'Adaptive cruise control', '360° camera', 'Head-up display'],
  sport: ['Sports exhaust', 'Carbon-ceramic brakes', 'Launch control', 'Adaptive dampers', 'Bucket seats', 'Track telemetry'],
  offroad: ['Four-wheel drive', 'Locking differentials', 'Hill descent control', 'Tow bar', 'All-terrain tyres'],
  ev: ['Over-the-air updates', 'Home charger included', 'Heat pump', 'Glass roof', 'Autopilot'],
};

/**
 * Compact car factory. `opt` overrides derived fields.
 * tier: 1 = everyday, 2 = well equipped, 3 = luxury, 4 = performance
 */
function car(id, make, model, trim, year, price, km, fuel, gearbox, body, engine, power, colour, images, opt = {}) {
  const tier = opt.tier ?? (price > 8e6 ? 4 : price > 3e6 ? 3 : price > 1.4e6 ? 2 : 1);
  let features = [...FEATURE_SETS.base];
  if (tier >= 2) features.push(...FEATURE_SETS.mid);
  if (tier >= 3) features.push(...FEATURE_SETS.high);
  if (tier >= 4 && (body === 'Coupe' || body === 'Convertible')) features.push(...FEATURE_SETS.sport.slice(0, 4));
  if (opt.offroad) features.push(...FEATURE_SETS.offroad);
  if (fuel === 'Electric') features.push(...FEATURE_SETS.ev);
  return {
    id, make, model, trim, year, price, km, fuel, gearbox, body, engine, power, colour,
    images: images.map((p) => img(p)),
    seats: opt.seats ?? SEATS[body],
    drive: opt.drive ?? (opt.offroad ? '4x4' : 'Rear-wheel drive'),
    owners: opt.owners ?? (year >= 2022 ? 1 : year >= 2018 ? 1 + (km > 40000 ? 1 : 0) : 2),
    added: opt.added ?? '2026-10-01',
    status: opt.status ?? 'In showroom',
    warranty: opt.warranty ?? (year >= 2020 ? '24 months' : year >= 2012 ? '12 months' : '6 months'),
    features,
  };
}

const FWD = { drive: 'Front-wheel drive' };
const AWD = { drive: 'All-wheel drive' };

export const CARS = [
  car('porsche-911-gt3rs-2018', 'Porsche', '911 GT3 RS', '991.2', 2018, 13900000, 14600, 'Petrol', 'Automatic', 'Coupe', '4.0 L flat-six', 520, 'GT silver', ['photo-1634673970798-a15ae56f6c65'], { added: '2026-10-29', status: 'Just arrived' }),
  car('porsche-911-gt3rs-2023', 'Porsche', '911 GT3 RS', 'Weissach package', 2023, 19900000, 3100, 'Petrol', 'Automatic', 'Coupe', '4.0 L flat-six', 525, 'Racing yellow', ['photo-1687815529363-846223d93c55'], { added: '2026-10-21', status: 'Reserved' }),
  car('porsche-911-gt3-2018', 'Porsche', '911 GT3', '991.2 Clubsport', 2018, 10950000, 21800, 'Petrol', 'Manual', 'Coupe', '4.0 L flat-six', 500, 'Carrara white', ['photo-1614162692292-7ac56d7f7f1e'], { added: '2026-10-12' }),
  car('porsche-911-gt2rs-2018', 'Porsche', '911 GT2 RS', '991 Weissach package', 2018, 24500000, 6900, 'Petrol', 'Automatic', 'Coupe', '3.8 L twin-turbo flat-six', 700, 'Black', ['photo-1778432999466-1f0a0705d481'], { added: '2026-10-31', status: 'Just arrived' }),
  car('lamborghini-huracan-evo-2021', 'Lamborghini', 'Huracán EVO', 'Coupe', 2021, 21500000, 9800, 'Petrol', 'Automatic', 'Coupe', '5.2 L V10', 640, 'Grigio Titans matt', ['photo-1657217674164-9cbf85acfc6d'], { added: '2026-10-31', status: 'Just arrived', ...AWD }),
  car('lamborghini-huracan-spyder-2020', 'Lamborghini', 'Huracán EVO Spyder', 'Convertible', 2020, 19750000, 14200, 'Petrol', 'Automatic', 'Convertible', '5.2 L V10', 640, 'Bianco Monocerus', ['photo-1611900713725-864f48309d67'], { added: '2026-10-17', ...AWD }),
  car('mercedes-amg-gtr-2019', 'Mercedes-Benz', 'AMG GT R', 'Coupe', 2019, 11800000, 17600, 'Petrol', 'Automatic', 'Coupe', '4.0 L twin-turbo V8', 585, 'Matte black', ['photo-1617814065893-00757125efab'], { added: '2026-10-24' }),
  car('mercedes-amg-gt-2018', 'Mercedes-Benz', 'AMG GT', 'S coupe', 2018, 7450000, 29800, 'Petrol', 'Automatic', 'Coupe', '4.0 L twin-turbo V8', 522, 'Jupiter red', ['photo-1553440569-bcc63803a83d'], { added: '2026-09-27' }),
  car('mercedes-g63-2021', 'Mercedes-Benz', 'G 63 AMG', 'Night package', 2021, 16900000, 21400, 'Petrol', 'Automatic', 'SUV', '4.0 L twin-turbo V8', 585, 'Obsidian black', ['photo-1648413653877-ade5eefd2f1b'], { added: '2026-10-30', status: 'Just arrived', offroad: true }),
  car('mercedes-g500-2019', 'Mercedes-Benz', 'G 500', 'AMG Line', 2019, 11250000, 38900, 'Petrol', 'Automatic', 'SUV', '4.0 L twin-turbo V8', 422, 'Obsidian black', ['photo-1623671228672-7f56ddea1e0b'], { added: '2026-10-03', offroad: true }),
  car('range-rover-2020', 'Land Rover', 'Range Rover', 'Vogue SE P400', 2020, 8950000, 41200, 'Petrol', 'Automatic', 'SUV', '3.0 L mild-hybrid six', 400, 'British racing green', ['photo-1549632891-a0bea6d0355b'], { added: '2026-10-19', offroad: true }),
  car('range-rover-sport-svr-2021', 'Land Rover', 'Range Rover Sport', 'SVR', 2021, 9750000, 26300, 'Petrol', 'Automatic', 'SUV', '5.0 L supercharged V8', 575, 'Fuji white', ['photo-1725815761064-b84c3f4f9b94'], { added: '2026-10-27', status: 'Just arrived', offroad: true }),
  car('bmw-m5-2022', 'BMW', 'M5 Competition', 'F90 LCI', 2022, 6750000, 18900, 'Petrol', 'Automatic', 'Sedan', '4.4 L twin-turbo V8', 625, 'Alpine white', ['photo-1729966085578-c7b281cf11da'], { added: '2026-10-30', status: 'Just arrived', ...AWD }),
  car('bmw-m2-2020', 'BMW', 'M2', 'Competition', 2020, 3450000, 24100, 'Petrol', 'Automatic', 'Coupe', '3.0 L twin-turbo six', 410, 'Alpine white', ['photo-1600268330186-76564be81357'], { added: '2026-10-08', seats: 4 }),
  car('bmw-m4-2019', 'BMW', 'M4', 'Competition coupe', 2019, 3950000, 33700, 'Petrol', 'Automatic', 'Coupe', '3.0 L twin-turbo six', 450, 'Yas Marina blue', ['flagged/photo-1553505192-acca7d4509be'], { added: '2026-10-02', seats: 4 }),
  car('bmw-m3-2018', 'BMW', 'M3', 'F80 Competition', 2018, 3250000, 41800, 'Petrol', 'Automatic', 'Sedan', '3.0 L twin-turbo six', 450, 'Tanzanite blue', ['photo-1614026480209-cd9934144671'], { added: '2026-09-24' }),
  car('audi-rs6-2021', 'Audi', 'RS 6 Avant', 'Carbon black', 2021, 8250000, 24600, 'Petrol', 'Automatic', 'Sedan', '4.0 L twin-turbo V8', 600, 'Tango red', ['photo-1650803878810-1e4eaffc8466'], { added: '2026-10-22', ...AWD }),
  car('audi-a6-2016', 'Audi', 'A6', '3.0 TDI quattro S line', 2016, 1650000, 88400, 'Diesel', 'Automatic', 'Sedan', '3.0 L V6 TDI', 272, 'Floret silver', ['photo-1656335889409-808b4119393f'], { added: '2026-09-18', ...AWD }),
  car('tesla-model3-perf-2022', 'Tesla', 'Model 3', 'Performance', 2022, 2850000, 26300, 'Electric', 'Automatic', 'Sedan', 'Dual motor, 75 kWh', 513, 'Pearl white', ['photo-1610470832703-95d40c3fad55'], { added: '2026-10-28', status: 'Just arrived', ...AWD }),
  car('tesla-model3-2021', 'Tesla', 'Model 3', 'Standard Range Plus', 2021, 2150000, 38700, 'Electric', 'Automatic', 'Sedan', 'Single motor, 55 kWh', 283, 'Pearl white', ['photo-1560958089-b8a1929cea89'], { added: '2026-10-09' }),
  car('nissan-patrol-1996', 'Nissan', 'Patrol', 'GR Y60 4.2 diesel', 1996, 1150000, 187400, 'Diesel', 'Manual', 'SUV', '4.2 L six diesel', 145, 'Black', ['photo-1740921491047-a020ff4ef99b', 'photo-1740921491065-157b5d5d138f'], { added: '2026-10-26', offroad: true, seats: 7, tier: 1, warranty: '6 months', owners: 3 }),
  car('toyota-land-cruiser-2019', 'Toyota', 'Land Cruiser', 'LC200 VX-R', 2019, 5450000, 61200, 'Diesel', 'Automatic', 'SUV', '4.5 L twin-turbo V8 diesel', 268, 'Black', ['photo-1650530579355-7ad9d4766043'], { added: '2026-10-25', offroad: true, seats: 7 }),
  car('toyota-land-cruiser-fj62-1989', 'Toyota', 'Land Cruiser', 'FJ62 GX', 1989, 1950000, 214000, 'Petrol', 'Automatic', 'SUV', '4.0 L straight-six', 155, 'Beige and brown', ['photo-1554841649-de947c4b954a'], { added: '2026-09-14', offroad: true, seats: 7, tier: 1, owners: 4, warranty: '6 months' }),
  car('jeep-wrangler-2021', 'Jeep', 'Wrangler', 'Sahara Unlimited', 2021, 3450000, 33800, 'Petrol', 'Automatic', 'SUV', '2.0 L turbo four', 272, 'Black', ['photo-1591105327764-4c4b76f9e6a0'], { added: '2026-10-11', offroad: true }),
  car('jeep-wrangler-rubicon-2023', 'Jeep', 'Wrangler', 'Rubicon', 2023, 4350000, 11900, 'Petrol', 'Automatic', 'SUV', '2.0 L turbo four', 272, 'Bright white', ['photo-1759428858123-9dfd095c9eb5'], { added: '2026-10-29', status: 'Just arrived', offroad: true }),
  car('vw-tiguan-2021', 'Volkswagen', 'Tiguan', 'R-Line 2.0 TSI', 2021, 2350000, 29500, 'Petrol', 'Automatic', 'SUV', '2.0 L turbo four', 190, 'Deep black pearl', ['photo-1758228674135-ccb8865f1b02'], { added: '2026-10-15', ...AWD }),
  car('kia-sportage-2023', 'Kia', 'Sportage', 'GT-Line hybrid', 2023, 2250000, 14800, 'Hybrid', 'Automatic', 'SUV', '1.6 L turbo hybrid', 230, 'Black pearl', ['photo-1649921777129-a28a26031a03', 'photo-1665736721212-711a6e52933b'], { added: '2026-10-20', ...FWD }),
  car('hyundai-creta-2017', 'Hyundai', 'Creta', '1.6 GL', 2017, 795000, 69800, 'Petrol', 'Manual', 'SUV', '1.6 L four', 123, 'Passion red', ['photo-1748214547306-360d11024747', 'photo-1748214547184-d994bfe53322'], { added: '2026-10-05', ...FWD }),
  car('ford-f150-2021', 'Ford', 'F-150', 'Lariat SuperCrew', 2021, 3900000, 36800, 'Petrol', 'Automatic', 'Pickup', '5.0 L V8', 400, 'Velocity blue', ['photo-1551830820-330a71b99659'], { added: '2026-10-18', offroad: true }),
  car('toyota-hilux-2022', 'Toyota', 'Hilux', '2.8 GD-6 Legend', 2022, 2450000, 31700, 'Diesel', 'Automatic', 'Pickup', '2.8 L turbo diesel', 204, 'Glacier white', ['photo-1759213281196-6c5e463b3021'], { added: '2026-10-23', offroad: true }),
  car('toyota-tacoma-2019', 'Toyota', 'Tacoma', 'TRD Off-Road', 2019, 2650000, 58400, 'Petrol', 'Automatic', 'Pickup', '3.5 L V6', 278, 'Quicksand', ['photo-1559416523-140ddc3d238c'], { added: '2026-09-21', offroad: true }),
  car('vw-golf-r-2018', 'Volkswagen', 'Golf R', 'Mk7.5 DSG', 2018, 1650000, 54200, 'Petrol', 'Automatic', 'Hatchback', '2.0 L turbo four', 310, 'Deep black pearl', ['photo-1591230740238-e9a71182b67c'], { added: '2026-10-14', ...AWD }),
  car('vw-golf-2017', 'Volkswagen', 'Golf', '7 TDI Highline', 2017, 1150000, 78400, 'Diesel', 'Automatic', 'Hatchback', '2.0 L TDI', 150, 'Pure white', ['photo-1714225317039-d685f0e1cd38'], { added: '2026-10-28', status: 'Just arrived', ...FWD }),
  car('vw-polo-gti-2020', 'Volkswagen', 'Polo GTI', 'DSG', 2020, 1395000, 36100, 'Petrol', 'Automatic', 'Hatchback', '2.0 L turbo four', 200, 'Limestone grey', ['photo-1671917501165-c99426010640'], { added: '2026-10-07', ...FWD }),
  car('mini-cooper-s-2021', 'Mini', 'Cooper S', 'Sport 3-door', 2021, 1750000, 22800, 'Petrol', 'Automatic', 'Hatchback', '2.0 L turbo four', 178, 'Island blue', ['photo-1626682265474-39e839533069'], { added: '2026-10-16', ...FWD, seats: 4 }),
  car('mini-cooper-s-2010', 'Mini', 'Cooper S', 'R56 3-door', 2010, 650000, 97600, 'Petrol', 'Manual', 'Hatchback', '1.6 L turbo four', 175, 'Volcanic orange', ['photo-1591316638441-bc659685017d'], { added: '2026-09-26', ...FWD, seats: 4 }),
  car('suzuki-swift-sport-2022', 'Suzuki', 'Swift Sport', '1.4 Boosterjet', 2022, 1095000, 18600, 'Petrol', 'Manual', 'Hatchback', '1.4 L turbo four', 140, 'Speedy blue', ['photo-1699862335489-36f7dec55c0e'], { added: '2026-10-21', ...FWD }),
  car('suzuki-swift-sport-2010', 'Suzuki', 'Swift Sport', '1.6', 2010, 395000, 118300, 'Petrol', 'Manual', 'Hatchback', '1.6 L four', 125, 'Arctic white', ['photo-1709538513947-5d4d838d3452'], { added: '2026-10-04', ...FWD, warranty: '6 months' }),
  car('opel-astra-2017', 'Opel', 'Astra', '1.4 Turbo Elite', 2017, 795000, 66900, 'Petrol', 'Automatic', 'Hatchback', '1.4 L turbo four', 150, 'Summit white', ['photo-1582639510494-c80b5de9f148'], { added: '2026-09-30', ...FWD }),
  car('toyota-corolla-2021', 'Toyota', 'Corolla', '1.8 Hybrid XLi', 2021, 1250000, 33900, 'Hybrid', 'Automatic', 'Sedan', '1.8 L hybrid', 122, 'Super white', ['photo-1623869675781-80aa31012a5a'], { added: '2026-10-13', ...FWD }),
  car('mazda-mx5-2012', 'Mazda', 'MX-5', '2.0 Sport', 2012, 895000, 72400, 'Petrol', 'Manual', 'Convertible', '2.0 L four', 160, 'True red', ['photo-1734182133787-45819cf35564'], { added: '2026-10-10' }),
  car('mazda-mx5-1999', 'Mazda', 'MX-5', 'NB 1.8', 1999, 595000, 141800, 'Petrol', 'Manual', 'Convertible', '1.8 L four', 140, 'White with race livery', ['photo-1692011249411-c748b88f828d'], { added: '2026-09-20', warranty: '6 months' }),
];

export const byId = (id) => CARS.find((c) => c.id === id);
export const carName = (c) => `${c.year} ${c.make} ${c.model}`;
export const rs = (n) => 'Rs ' + Math.round(n).toLocaleString('en-US');
export const km = (n) => n.toLocaleString('en-US') + ' km';

export function monthly(price, depositPct = 20, months = 60, rate = DEALER.financeRate) {
  const principal = price * (1 - depositPct / 100);
  const r = rate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

/** Deterministic pseudo-random 0..1 from a string (for inspection scores etc.). */
export function seeded(str, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}
