import { CARS } from '../data.js';
import { dealerJsonLd, breadcrumbJsonLd } from './templates.js';

const n = CARS.length;

/** Unique title + description per page (keyed by file path relative to the site root). */
export const META = {
  'index.html': {
    path: '',
    title: 'V8 Motors | Inspected pre-owned cars in Beau Bassin, Mauritius',
    desc: `${n} inspected pre-owned cars with a warranty, on Royal Road in Beau Bassin. Browse the stock, sell your car or work out finance in rupees.`,
    jsonld: () => [dealerJsonLd()],
  },
  'inventory.html': {
    path: 'inventory.html',
    title: `Used cars for sale in Mauritius, ${n} in stock | V8 Motors`,
    desc: 'Filter every car at V8 Motors by make, body type, price, year, mileage and fuel. Each one is inspected and comes with a warranty.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Inventory', 'inventory.html']])],
  },
  'compare.html': {
    path: 'compare.html',
    title: 'Compare cars side by side | V8 Motors',
    desc: 'Put up to three V8 Motors cars side by side: price, monthly payment, mileage, power and equipment.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Inventory', 'inventory.html'], ['Compare', 'compare.html']])],
  },
  'sell.html': {
    path: 'sell.html',
    title: 'Sell your car in Mauritius, offer within a day | V8 Motors',
    desc: 'Three short steps for a rough guide price now and a written offer within one working day. Paid the same day, NLTA transfer handled.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Sell your car', 'sell.html']])],
  },
  'finance.html': {
    path: 'finance.html',
    title: 'Car finance calculator in rupees | V8 Motors',
    desc: 'Work out your monthly car payment, see the balance year by year, and ask V8 Motors about finance through local banks.',
    jsonld: () => [breadcrumbJsonLd([['Home', ''], ['Finance', 'finance.html']])],
  },
  'contact.html': {
    path: 'contact.html',
    title: 'Visit the showroom in Beau Bassin | V8 Motors',
    desc: 'Opening hours, directions and contact details for the V8 Motors showroom on Royal Road, Beau Bassin.',
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
    desc: 'The terms that apply when you use the V8 Motors website, reserve a car, book a test drive or buy from us.',
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
