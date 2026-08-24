/*
 * Shared WhatsApp automation for Rishikesh Jewellers.
 * Loaded on every page so the business number, click-to-chat links,
 * online/offline status, and the cart (used to build a WhatsApp order
 * message) stay consistent and in sync across Home / Shop / Product.
 */
(function () {
  'use strict';

  var NUMBER = '911234567890';
  var BRAND = 'Rishikesh Jewellers';
  var SITE = 'rishikeshjewellers.in';
  var CART_KEY = 'rj_whatsapp_cart_v1';
  var OPEN_HOUR = 10;
  var CLOSE_HOUR = 20;

  function istNow() {
    var now = new Date();
    var utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 5.5 * 3600000);
  }

  function status() {
    var ist = istNow();
    var day = ist.getDay();
    var hour = ist.getHours() + ist.getMinutes() / 60;
    var open = day !== 0 && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
    return {
      online: open,
      label: open ? 'Online now' : 'Offline',
      sub: open
        ? 'Typically replies in under 10 min'
        : 'Message us — we reply by ' + (day === 6 ? 'Monday, 10 AM' : '10 AM'),
    };
  }

  function link(message) {
    var text = message + '\n\n— sent from ' + SITE;
    return 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(text);
  }

  function readCart() {
    try {
      var raw = window.localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    try {
      window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (e) {
      /* localStorage unavailable (private mode, etc.) — cart just won't persist */
    }
    document.dispatchEvent(new CustomEvent('rj-cart-change', { detail: { items: items } }));
  }

  function addToCart(item) {
    var items = readCart();
    var existing = items.filter(function (i) {
      return i.id === item.id && i.variant === item.variant;
    })[0];
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      items.push({
        id: item.id,
        name: item.name,
        variant: item.variant || '',
        price: item.price,
        qty: item.qty || 1,
      });
    }
    writeCart(items);
    return items;
  }

  function cartCount() {
    return readCart().reduce(function (n, i) {
      return n + i.qty;
    }, 0);
  }

  function cartTotal() {
    return readCart().reduce(function (n, i) {
      return n + i.qty * i.price;
    }, 0);
  }

  function cartMessage() {
    var items = readCart();
    if (!items.length) {
      return 'Hi, I would like to talk to someone about ' + BRAND + '’s collections.';
    }
    var lines = items.map(function (i, idx) {
      var variant = i.variant ? ' (' + i.variant + ')' : '';
      return (idx + 1) + '. ' + i.name + variant + ' ×' + i.qty + ' — ₹' + (i.price * i.qty).toLocaleString('en-IN');
    });
    return (
      'Hi, I would like to order:\n' +
      lines.join('\n') +
      '\n\nTotal: ₹' + cartTotal().toLocaleString('en-IN')
    );
  }

  window.RJWhatsApp = {
    NUMBER: NUMBER,
    status: status,
    link: link,
    addToCart: addToCart,
    readCart: readCart,
    cartCount: cartCount,
    cartTotal: cartTotal,
    cartMessage: cartMessage,
  };
})();
