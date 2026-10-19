/**
 * Amazon Retail & Fresh Fulfillment Service
 * Formats 1-Click Amazon Prime search queries, cart bundles, ASIN lookups, and category enrichment
 */

export class AmazonService {
  static CATALOG_LOOKUP = {
    'coffee filters': {
      asin: 'B01N07G9LJ',
      brand: 'Melitta',
      category: 'Household Supplies',
      query: 'Melitta #4 Cone Coffee Filters Unbleached 100 Count',
      defaultQty: '100 Count',
      unitPrice: 4.49,
      estimatedPrice: '$4.49',
      deliveryBadge: 'Prime Same-Day',
      subscribeSave: '15% Subscribe & Save',
      isFresh: false
    },
    'coffee beans': {
      asin: 'B07F2N3YTR',
      brand: 'Amazon Fresh Colombia',
      category: 'Grocery & Gourmet',
      query: 'Organic Whole Bean Medium Roast Coffee 12 oz',
      defaultQty: '12 oz Bag',
      unitPrice: 12.99,
      estimatedPrice: '$12.99',
      deliveryBadge: 'Prime Overnight',
      subscribeSave: '10% Subscribe & Save',
      isFresh: false
    },
    'oat milk': {
      asin: 'B07WCJ8K4P',
      brand: 'Oatly',
      category: 'Amazon Fresh',
      query: 'Oatly Oat Milk Barista Edition 32 fl oz',
      defaultQty: '64 oz (2-Pack)',
      unitPrice: 5.49,
      estimatedPrice: '$5.49',
      deliveryBadge: 'Prime Fresh • Today',
      subscribeSave: '5% Subscribe & Save',
      isFresh: true
    },
    'whole milk': {
      asin: 'B078738Q2N',
      brand: '365 by Whole Foods Market',
      category: 'Amazon Fresh',
      query: '365 Whole Foods Market Organic Whole Milk 1 Gallon',
      defaultQty: '1 Gallon',
      unitPrice: 4.99,
      estimatedPrice: '$4.99',
      deliveryBadge: 'Prime Fresh • 2-Hr Delivery',
      subscribeSave: '5% Subscribe & Save',
      isFresh: true
    },
    'milk': {
      asin: 'B078738Q2N',
      brand: '365 by Whole Foods Market',
      category: 'Amazon Fresh',
      query: '365 Whole Foods Market Organic Whole Milk 1 Gallon',
      defaultQty: '1 Gallon',
      unitPrice: 4.99,
      estimatedPrice: '$4.99',
      deliveryBadge: 'Prime Fresh • 2-Hr Delivery',
      subscribeSave: '5% Subscribe & Save',
      isFresh: true
    },
    'eggs': {
      asin: 'B078729XYR',
      brand: 'Vital Farms',
      category: 'Amazon Fresh',
      query: 'Vital Farms Pasture-Raised Large Eggs 12 Count',
      defaultQty: '1 Dozen',
      unitPrice: 5.99,
      estimatedPrice: '$5.99',
      deliveryBadge: 'Prime Fresh • 2-Hr Delivery',
      subscribeSave: 'Eligible',
      isFresh: true
    },
    'coffee': {
      asin: 'B07F2N3YTR',
      brand: 'Amazon Fresh Colombia',
      category: 'Grocery & Gourmet',
      query: 'Organic Whole Bean Medium Roast Coffee 12 oz',
      defaultQty: '12 oz Bag',
      unitPrice: 12.99,
      estimatedPrice: '$12.99',
      deliveryBadge: 'Prime Overnight',
      subscribeSave: '10% Subscribe & Save',
      isFresh: false
    },
    'batteries': {
      asin: 'B00MNV8E0C',
      brand: 'Amazon Basics',
      category: 'Amazon Basics Electronics',
      query: 'Amazon Basics AA High-Performance Alkaline Batteries 20-Pack',
      defaultQty: '20-Pack',
      unitPrice: 14.99,
      estimatedPrice: '$14.99',
      deliveryBadge: 'Prime Same-Day',
      subscribeSave: '10% Subscribe & Save',
      isFresh: false
    },
    'usb-c cable': {
      asin: 'B08PVPTW7Z',
      brand: 'Anker',
      category: 'Electronics & Accessories',
      query: 'Anker USB-C to USB-C 100W Braided Fast Charging Cable 6ft 2-Pack',
      defaultQty: '2-Pack (6ft)',
      unitPrice: 15.99,
      estimatedPrice: '$15.99',
      deliveryBadge: 'Prime Overnight',
      subscribeSave: 'Prime Exclusive',
      isFresh: false
    },
    'cable': {
      asin: 'B08PVPTW7Z',
      brand: 'Anker',
      category: 'Electronics & Accessories',
      query: 'Anker USB-C to USB-C 100W Braided Fast Charging Cable 6ft 2-Pack',
      defaultQty: '2-Pack (6ft)',
      unitPrice: 15.99,
      estimatedPrice: '$15.99',
      deliveryBadge: 'Prime Overnight',
      subscribeSave: 'Prime Exclusive',
      isFresh: false
    },
    'paper towels': {
      asin: 'B079VP6DH5',
      brand: 'Amazon Brand - Presto!',
      category: 'Household Essentials',
      query: 'Presto Flex-a-Size Paper Towels 12 Huge Rolls',
      defaultQty: '12 Rolls',
      unitPrice: 24.49,
      estimatedPrice: '$24.49',
      deliveryBadge: 'Prime Tomorrow',
      subscribeSave: '15% Subscribe & Save',
      isFresh: false
    },
    'bread': {
      asin: 'B078123ABC',
      brand: '365 by Whole Foods Market',
      category: 'Amazon Fresh Bakery',
      query: 'Organic Sourdough Sandwich Bread 24 oz',
      defaultQty: '1 Loaf',
      unitPrice: 4.29,
      estimatedPrice: '$4.29',
      deliveryBadge: 'Prime Fresh • 2-Hr Delivery',
      subscribeSave: 'Eligible',
      isFresh: true
    }
  };

  /**
   * Generate 1-Click Amazon Search & Buy URL
   */
  static generateAmazonSearchUrl(query) {
    const encoded = encodeURIComponent((query || 'Household Essentials').trim());
    return `https://www.amazon.com/s?k=${encoded}&i=aps&ref=bee_ambient_commerce`;
  }

  /**
   * Generate Amazon Direct Cart / Buy Box URL
   */
  static generateAmazonCartUrl(query, asin = null, quantity = 1) {
    if (asin) {
      return `https://www.amazon.com/gp/aws/cart/add.html?ASIN.1=${encodeURIComponent(asin)}&Quantity.1=${quantity}&ref=bee_prime_quickbuy`;
    }
    const encoded = encodeURIComponent((query || 'Household Essentials').trim());
    return `https://www.amazon.com/s?k=${encoded}&s=relevanceblender&ref=bee_prime_quickbuy`;
  }

  /**
   * Generate Multi-Item Amazon Bundle Cart URL
   * Uses native multi-ASIN cart endpoint if ASINs are resolved, falling back to combined search
   */
  static generateBundleUrl(items = []) {
    if (!items.length) return 'https://www.amazon.com';

    const asinItems = items
      .map((item) => item.details?.asin || item.asin)
      .filter(Boolean);

    if (asinItems.length > 0) {
      const params = asinItems
        .slice(0, 10)
        .map((asin, idx) => `ASIN.${idx + 1}=${encodeURIComponent(asin)}&Quantity.${idx + 1}=1`)
        .join('&');
      return `https://www.amazon.com/gp/aws/cart/add.html?${params}&ref=bee_bundle_restock`;
    }

    const combinedQuery = items
      .map((item) => item.details?.productName || item.title)
      .filter(Boolean)
      .slice(0, 4)
      .join(' ');
    return `https://www.amazon.com/s?k=${encodeURIComponent(combinedQuery)}&ref=bee_bundle_restock`;
  }

  /**
   * Parse numeric multiplier from spoken quantity (e.g., "2 gallons" -> 2, "20-Pack" -> 1)
   */
  static parseNumericMultiplier(quantityStr) {
    if (!quantityStr || typeof quantityStr !== 'string') return 1;
    // Avoid multiplying pack sizes like "20-Pack" or "64 oz"
    if (/pack|count|ct|oz|lb|roll/i.test(quantityStr)) return 1;
    const numMatch = quantityStr.match(/^(\d+)\b/);
    if (numMatch) {
      const parsed = parseInt(numMatch[1], 10);
      return parsed > 0 && parsed <= 12 ? parsed : 1;
    }
    return 1;
  }

  /**
   * Enrich product details for Amazon retail presentation
   */
  static enrichProduct(productName, quantity) {
    const safeProductName = (productName || 'Household Item').trim();
    const cleanName = safeProductName.toLowerCase();
    let match = null;

    // Sort catalog keys longest-first so "coffee filters" and "oat milk" match before "coffee" or "milk"
    const sortedEntries = Object.entries(this.CATALOG_LOOKUP).sort(
      ([keyA], [keyB]) => keyB.length - keyA.length
    );

    for (const [key, data] of sortedEntries) {
      if (cleanName.includes(key)) {
        match = data;
        break;
      }
    }

    const multiplier = this.parseNumericMultiplier(quantity);
    const baseUnitPrice = match ? match.unitPrice : 9.99;
    const totalPrice = Number((baseUnitPrice * multiplier).toFixed(2));
    const estimatedPrice = `$${totalPrice.toFixed(2)}`;

    const asin = match ? match.asin : null;
    const finalQuery = match ? match.query : safeProductName;
    const category = match ? match.category : 'Amazon Prime Retail';
    const brand = match ? match.brand : 'Amazon Prime Selection';
    const deliveryBadge = match ? match.deliveryBadge : 'Prime FREE One-Day';
    const subscribeSave = match ? match.subscribeSave : 'Prime Eligible';
    const amazonUrl = this.generateAmazonSearchUrl(finalQuery);
    const cartUrl = this.generateAmazonCartUrl(finalQuery, asin, multiplier);

    return {
      asin,
      productName: safeProductName,
      brand,
      query: finalQuery,
      quantity: quantity || (match ? match.defaultQty : '1 Unit'),
      category,
      unitPrice: baseUnitPrice,
      totalPrice,
      estimatedPrice,
      deliveryBadge,
      subscribeSave,
      isFresh: match ? match.isFresh : false,
      amazonUrl,
      cartUrl
    };
  }
}