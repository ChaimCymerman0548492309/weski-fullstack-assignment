import React from 'react';
import './nav-bar.scss';
import WeSkiLogo from '../weski-logo/weski-logo';
import SearchForm from '../search-form/search-form';
import { HotelResult } from '../../App';

type Props = {
  onResults: (items: HotelResult[]) => void;
  onLoading: (v: boolean) => void;
  onError: (msg: string | null) => void;
};

const NavBar: React.FC<Props> = ({ onResults, onLoading, onError }) => {
  return (
    <div className="nav-bar">
      <WeSkiLogo />
      <SearchForm onResults={onResults} onLoading={onLoading} onError={onError} />
    </div>
  );
};

export default NavBar;
