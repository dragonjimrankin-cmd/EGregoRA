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
 *
 * This is EGregoRA's shelf: the prints and the figures, which belong to both
 * houses. The clothing line is The Two Infinities' and stays there.
 */

export const SHELF = {
  'ed-keeper':     { name: 'Ed Gregory \u2014 "Keeper"',                  price: 35 },
  'ed-hood':       { name: 'Ed Gregory \u2014 "Hood Up"',                 price: 35 },
  'ed-duo':        { name: '"The Conversation" Two-Pack',            price: 60 },
  'ed-desk':       { name: 'Ed Gregory \u2014 "Expand the Space" Deluxe', price: 45 },
  'fox-figure':    { name: 'The Fox',                                price: 25 },
  'fox-pin':       { name: 'Fox Enamel Pin',                         price: 12 },
  'badger-figure': { name: 'The Badger',                             price: 25 },
  'badger-pin':    { name: 'Badger Enamel Pin',                      price: 12 },
  'duo-both':      { name: 'Or Both! \u2014 Fox and Badger Set',          price: 40 }
};

/** What an order reference begins with, so the two houses' ledgers can be told
    apart at a glance. */
export const REF_PREFIX = 'EG';

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

export const HOUSE_LABEL = 'EGregoRA';
export const SHOP_TITLE = 'The Shop';
export const SHOP_LINE = 'Life, Love, Magic.';
