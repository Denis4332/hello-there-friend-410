import { Link } from 'react-router-dom';

interface CityCardProps {
  name: string;
  slug: string;
}

export const CityCard = ({ name, slug }: CityCardProps) => {
  return (
    <Link to={`/stadt/${slug}`}>
      <div className="bg-card border rounded-lg p-6 hover:border-primary transition-colors">
        <h3 className="text-lg font-bold text-center">{name}</h3>
      </div>
    </Link>
  );
};
