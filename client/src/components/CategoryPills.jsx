import { BatteryCharging, CircleGauge, Disc3, Gauge, Layers, Wrench } from 'lucide-react';

export const CategoryPills = ({ categories, activeCategoryId, onSelectCategory, totalProductsCount }) => {
  // Category icon helper
  const getCategoryIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('oli')) return <Gauge size={15} />;
    if (lower.includes('ban') || lower.includes('velg')) return <CircleGauge size={15} />;
    if (lower.includes('rem') || lower.includes('pengereman')) return <Disc3 size={15} />;
    if (lower.includes('listrik') || lower.includes('ecu')) return <BatteryCharging size={15} />;
    if (lower.includes('rantai') || lower.includes('gear')) return <CircleGauge size={15} />;
    if (lower.includes('sparepart') || lower.includes('mesin')) return <Wrench size={15} />;
    return <Layers size={15} />;
  };

  return (
    <div className="category-pills-wrapper">
      <div className="category-pills-scroll">
        {/* All Products Pill */}
        <button
          className={`category-pill ${activeCategoryId === '*' ? 'active' : ''}`}
          onClick={() => onSelectCategory('*')}
          id="cat-pill-all"
        >
          <Layers size={15} />
          <span>Semua Produk</span>
          <span className="pill-count">{totalProductsCount}</span>
        </button>

        {/* Dynamic Category Pills */}
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              id={`cat-pill-${cat.slug || cat.id}`}
            >
              {getCategoryIcon(cat.name)}
              <span>{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className="pill-count">{cat.productCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};