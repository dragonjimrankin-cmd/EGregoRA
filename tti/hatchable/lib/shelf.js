/**
 * lib/shelf.js — what is for sale, in one place.
 *
 * The page prints what is here and api/shop.js and api/checkout.js both read
 * it, so the three cannot drift apart: an item that is not in this object is
 * not for sale, whatever a page or a form says. To change the shop, change
 * this file.
 *
 * Prices are pounds. Stripe is handed pence, converted at the point of use,
 * because it counts in the smallest unit and refuses anything else.
 */

export const SHELF = {
  'tee-twin':        { name: 'The Two Infinities Tee',              price: 18 },
  'tee-arrow':       { name: 'The Arrow Tee',                       price: 18 },
  'tee-dots':        { name: 'Little Red Dots Tee',                 price: 18 },
  'ls-residue':      { name: 'Residue Long Sleeve',                 price: 22 },
  'bomber-night':    { name: 'Night Flight Bomber',                 price: 120 },
  'bomber-seam':     { name: 'The Seam Bomber',                     price: 120 },
  'bomber-ledger':   { name: 'The Ledger Bomber',                   price: 135 },
  'ring-seam':       { name: 'The Seam Ring',                       price: 85 },
  'pendant-torus':   { name: 'Galactic Torus Pendant',              price: 65 },
  'studs-dots':      { name: 'Little Red Dot Studs',                price: 40 },
  'brace-ledger':    { name: 'Cosmic Ledger Bracelet',              price: 75 },
  'ed-keeper':       { name: 'Ed Gregory \u2014 "Keeper"',               price: 35 },
  'ed-hood':         { name: 'Ed Gregory \u2014 "Hood Up"',              price: 35 },
  'ed-duo':          { name: '"The Conversation" Two-Pack',         price: 60 },
  'ed-desk':         { name: 'Ed Gregory \u2014 "Expand the Space" Deluxe', price: 45 },
  'fox-figure':      { name: 'The Fox',                             price: 25 },
  'fox-pin':         { name: 'Fox Enamel Pin',                      price: 12 },
  'badger-figure':   { name: 'The Badger',                          price: 25 },
  'badger-pin':      { name: 'Badger Enamel Pin',                   price: 12 },
  'duo-both':        { name: 'Or Both! \u2014 Fox and Badger Set',       price: 40 }
};

/** What an order reference begins with, so the two houses' ledgers can be told
    apart at a glance. */
export const REF_PREFIX = 'TTI';

/**
 * Paid membership. Stripe's subscriptions need a fixed amount at a fixed
 * interval — unlike a donation, the giver cannot choose the figure — so these
 * are the only three there are.
 */
export const MEMBERSHIP = {
  'member':     { name: 'Member',     amount: 5,   interval: 'month' },
  'patron':     { name: 'Patron',     amount: 12,  interval: 'month' },
  'benefactor': { name: 'Benefactor', amount: 120, interval: 'year' }
};

/** A gift, given once, at whatever the giver chooses inside these bounds. */
export const DONATION = { min: 1, max: 5000 };

export const ORDER_TO = 'shakradragon@gmail.com';

export const HOUSE_LABEL = 'The Two Infinities';
export const SHOP_TITLE = 'The Shape of Becoming \u2014 The Shop';
export const SHOP_LINE = 'The Eternal Integration, and the Pendulum That Cannot Settle.';
