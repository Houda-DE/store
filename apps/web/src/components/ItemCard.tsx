import { Link } from 'react-router-dom';
import type { Item } from '../api/types';
import './ItemCard.css';

interface Props {
  item: Item;
}

export function ItemCard({ item }: Props) {
  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-card-img-wrap">
        <img src={item.imageUrl} alt={item.name} className="item-card-img" loading="lazy" />
      </div>
      <div className="item-card-body">
        <p className="item-card-name">{item.name}</p>
        <p className="item-card-price">{parseFloat(item.price).toLocaleString()} DZD</p>
      </div>
    </Link>
  );
}
