import React from "react";
import './search-button.scss';

interface Props {
    onClick?: () => void;
}

const SearchButton: React.FC<Props> = ({onClick}) => {
    return (
        <button className="search-button" onClick={onClick}>
            Search
        </button>
    );
}

export default SearchButton;