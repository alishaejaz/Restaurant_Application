import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { sampleMenu } from '../sampleData';
import { apiFetch } from '../api';

// Canonical category names
const CANONICAL_CATEGORIES = ['Desi Food', 'Fast Food', 'Sweets', 'Drinks'];

// Normalise a raw category string to its canonical name.
// "fastfood", "fast food", "Fast Food" all map to "Fast Food".
// Unknown categories pass through as-is (trimmed).
const normalizeCategory = (raw = '') => {
  const slug = raw.toLowerCase().replace(/[\s_-]+/g, '');
  const match = CANONICAL_CATEGORIES.find(
    (c) => c.toLowerCase().replace(/[\s_-]+/g, '') === slug,
  );
  return match || raw.trim();
};

const PKR = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

// Fallback image per category so broken items still look reasonable
const CATEGORY_FALLBACKS = {
  'Desi Food': 'photo-1589302168068-964664d93dc0',
  'Fast Food':  'photo-1599487488170-d11ec9c172f0',
  'Sweets':     'photo-2oJ4eGRPqrE',
  'Drinks':     'photo-jKADJEdhk1U',
};
const DEFAULT_FALLBACK = 'photo-1589302168068-964664d93dc0';

const fallbackFor = (category) => {
  const canon = normalizeCategory(category);
  const id = CATEGORY_FALLBACKS[canon] || DEFAULT_FALLBACK;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
};

const EXACT_IMAGE_OVERRIDES = {
  'beef nihari': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5vjC_B9lXb-dxu94z7CXg4LBGizq5XMHyG8QeJF-jrf9bUcMKHyoGSwO3nLvuTO0vqaakajEyhK0xcOhJN3izgHqPQuYqZR1ikj4w5GE&s=10',
  'pizza': 'https://www.hunts.com/sites/g/files/qyyrlu211/files/uploadedImages/img_6934_48664.jpg',
  'gulab jamun': 'https://www.spiceupthecurry.com/wp-content/uploads/2020/08/gulab-jamun-recipe-1.jpg',
  'rasmalai': 'https://i.ytimg.com/vi/cGn0-fx_n0g/maxresdefault.jpg',
  'mango lassi': 'data:image/jpeg;base64,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',
};

const validImageUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
const imageUrlFor = (item) => {
  const name = item.name?.toLowerCase().trim();
  if (name && EXACT_IMAGE_OVERRIDES[name]) {
    return EXACT_IMAGE_OVERRIDES[name];
  }
  return validImageUrl(item.imageUrl) ? item.imageUrl.trim() : fallbackFor(item.category);
};

const MenuCard = ({ item, onAdd }) => (
  <article className="menu-card">
    <div className="menu-image-wrap">
      <img
        className="menu-image"
        src={imageUrlFor(item)}
        alt={item.name}
        onError={(e) => {
          e.target.src = fallbackFor(item.category);
        }}
      />
    </div>
    <div className="menu-copy">
      <span className="pill">{normalizeCategory(item.category)}</span>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <div className="card-footer">
        <strong>{PKR.format(Number(item.price))}</strong>
        <button className="secondary-button" type="button" onClick={() => onAdd(item)}>Add to cart</button>
      </div>
    </div>
  </article>
);

export default function MenuPage() {
  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addItem, itemCount } = useCart();

  useEffect(() => {
    apiFetch('/api/menu')
      .then((data) => setDbItems(Array.isArray(data) ? data : []))
      .catch(() => setDbItems([]))
      .finally(() => setLoading(false));
  }, []);

  // Normalise all items' categories before merging/grouping
  const allItems = useMemo(() => {
    const normalised = (items) =>
      items.map((i) => ({ ...i, category: normalizeCategory(i.category) }));

    if (dbItems.length === 0) {
      return normalised(sampleMenu);
    }

    return normalised(dbItems);
  }, [dbItems]);

  const groupedItems = useMemo(() => {
    const knownCategories = [...CANONICAL_CATEGORIES];
    // Append any genuinely new categories (after normalisation) not in the canonical list
    allItems.forEach((item) => {
      if (item.category && !knownCategories.includes(item.category)) {
        knownCategories.push(item.category);
      }
    });
    return knownCategories
      .map((category) => ({
        category,
        items: allItems.filter((item) => {
          const matchesCategory = item.category === category;
          const text = `${item.name} ${item.description || ''} ${item.category || ''}`.toLowerCase();
          const matchesSearch = text.includes(searchTerm.toLowerCase());
          return matchesCategory && matchesSearch;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [allItems, searchTerm]);

  return (
    <section className="menu-layout">
      <div className="menu-bar panel">
        <div>
          <span className="eyebrow">Pakistani kitchen</span>
          <h1>Our menu</h1>
          <p>Browse desi dishes, sweets, drinks, and fast food. Prices are shown in rupees.</p>
        </div>
        <div className="menu-bar-actions">
          <input
            className="menu-search"
            placeholder="Search biryani, kebab, kheer, lassi..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <Link className="primary-button" to="/cart">Cart ({itemCount})</Link>
        </div>
      </div>

      {loading && <p style={{ padding: '16px', color: 'var(--muted)' }}>Loading menu…</p>}

      {groupedItems.map((group) => (
        <section className="menu-section" key={group.category}>
          <div className="section-head menu-section-head">
            <div>
              <span className="eyebrow">{group.category}</span>
              <h2>{group.category} items</h2>
            </div>
          </div>
          <div className="grid-cards menu-grid">
            {group.items.map((item) => <MenuCard key={item._id} item={item} onAdd={addItem} />)}
          </div>
        </section>
      ))}
    </section>
  );
}
