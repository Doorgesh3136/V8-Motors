import { CARS } from '../data.js';
import { dealerJsonLd, breadcrumbJsonLd } from './templates.js';

const n = CARS.length;

/** Unique title + description per page (keyed by file path relative to the site root). */
export const META = {
  'index.html': {
    path: '',
    title: 'V8 Motors | Used cars in Coromandel, Mauritius. Buy, sell or exchange',
    desc: `${n} used cars for sale at 59B Royal Road, Coromandel. Buy, sell or exchange your car, with leasing through Rogers Capital. New stock every week.`,
    jsonld: () => [dealerJsonLd()],
  },
  'inventory.html': {
    path: 'inventory.html',
    title: `Used cars for sale in Mauritius, ${n} in stock | V8 Motors`,
    desc: `All ${n} cars at V8 Motors in Coromandel, with real photos and prices in rupees. Filter by make, body type, price, year, fuel and gearbox.`,
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Cars', 'inventory.html']])],
  },
  'forecourt.html': {
    path: 'forecourt.html',
    title: `Walk the forecourt: all ${n} cars, full screen | V8 Motors`,
    desc: `Every car at V8 Motors as its own short film. Swipe up for the next car, double-tap to park it in your garage, WhatsApp us in one tap.`,
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['The forecourt', 'forecourt.html']])],
  },
  'compare.html': {
    path: 'compare.html',
    title: 'Compare cars side by side | V8 Motors',
    desc: 'Put up to three V8 Motors cars side by side: price, monthly payment, year, engine, gearbox and more.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Cars', 'inventory.html'], ['Compare', 'compare.html']])],
  },
  'sell.html': {
    path: 'sell.html',
    title: 'Sell or exchange your car in Mauritius | V8 Motors',
    desc: 'Tell us about your car in three short steps for a rough guide price, then an offer from V8 Motors. Sell it outright or put it towards one of our cars.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Sell or exchange', 'sell.html']])],
  },
  'finance.html': {
    path: 'finance.html',
    title: 'Car leasing calculator in rupees | V8 Motors',
    desc: 'Work out a monthly payment for any car in stock and ask V8 Motors about leasing through Rogers Capital.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Leasing', 'finance.html']])],
  },
  'contact.html': {
    path: 'contact.html',
    title: 'Visit V8 Motors in Coromandel | Opening hours and directions',
    desc: 'V8 Motors, 59B Royal Road, Coromandel. Open Monday to Friday 9:00 to 17:00 and Saturday 9:00 to 16:00. Phone, WhatsApp, email and directions.',
    jsonld: () => [dealerJsonLd(), breadcrumbJsonLd([['Home', ''], ['Visit us', 'contact.html']])],
  },
  'privacy.html': {
    path: 'privacy.html',
    title: 'Privacy policy | V8 Motors',
    desc: 'What V8 Motors collects through this website, why, how long we keep it and your rights under the Mauritius Data Protection Act 2017.',
    jsonld: () => [],
  },
  'terms.html': {
    path: 'terms.html',
    title: 'Terms of sale and website terms | V8 Motors',
    desc: 'The terms that apply when you use the V8 Motors website, book a viewing or buy from us.',
    jsonld: () => [],
  },
  '404.html': {
    path: '404.html',
    title: 'Page not found | V8 Motors',
    desc: 'This page does not exist. Browse the cars in stock at V8 Motors instead.',
    jsonld: () => [],
  },
  'car.html': {
    path: 'inventory.html',
    title: 'Car details | V8 Motors',
    desc: 'Opening the car you asked for.',
    jsonld: () => [],
  },
};
