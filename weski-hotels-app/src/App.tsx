import React, { useState } from 'react';
import NavBar from './components/navbar/nav-bar';
import './App.scss';
import { HotelDistance, HotelImage, HotelItem,  } from './types';



const App: React.FC = () => {
  const [results, setResults] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderStars = (rating: string) => {
    const ratingNum = parseInt(rating, 10);
    return '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum);
  };

  const getMainImage = (images: HotelImage[]): string => {
    const mainImage = images.find((img) => img.MainImage === 'True');
    return mainImage ? mainImage.URL : images[0]?.URL || '';
  };

  const getSkiLiftDistance = (distances: HotelDistance[]): string => {
    const skiLift = distances.find((d) => d.type === 'ski_lift');
    return skiLift?.distance || 'N/A';
  };

  const getCityCenterDistance = (distances: HotelDistance[]): string => {
    const cityCenter = distances.find((d) => d.type === 'city_center');
    return cityCenter?.distance || 'N/A';
  };

  return (
    <div className="app">
      <NavBar onResults={setResults} onLoading={setLoading} onError={setError} />

      <div className="content-area">
        {error && <div className="error-message">{error}</div>}

        {loading && <div className="loading-state">🔍 מחפש מלונות מתאימים...</div>}

        {!loading && results.length > 0 && (
          <div className="results-section">
            <h2 className="results-title">נמצאו {results.length} מלונות</h2>

            {results.map((hotel, index) => (
              <div key={`${hotel.hotelId}-${index}`} className="hotel-card">
                <div className="card-content">
                  <div className="image-container">
                    <img
                      src={getMainImage(hotel.raw.HotelDescriptiveContent.Images)}
                      alt={hotel.hotelName}
                    />
                    <div className="capacity-badge">עד {hotel.maxPeople} אנשים</div>
                  </div>

                  <div className="details-container">
                    <div className="header-row">
                      <div className="hotel-info">
                        <h3 className="hotel-name">{hotel.hotelName || hotel.raw.HotelName}</h3>
                        <div className="rating-stars">{renderStars(hotel.raw.HotelInfo.Rating)}</div>
                      </div>

                      <div className="price-section">
                        <div className="price-label">מחיר כולל מסים</div>
                        <div className="price-amount">€{hotel.price.toFixed(2)}</div>
                        <div className="price-before-tax">
                          €{parseFloat(hotel.raw.PricesInfo.AmountBeforeTax).toFixed(2)} לפני מס
                        </div>
                      </div>
                    </div>

                    <div className="location-info">
                      <div className="distance-badges">
                        <span className="badge ski-lift-badge">
                          🚡 {getSkiLiftDistance(hotel.raw.HotelInfo.Position.Distances)} לרכבת
                        </span>
                        <span className="badge city-center-badge">
                          🏙️ {getCityCenterDistance(hotel.raw.HotelInfo.Position.Distances)} למרכז
                        </span>
                      </div>

                      <div className="beds-info">🛏️ עד {hotel.raw.HotelInfo.Beds} מיטות</div>
                    </div>

                    <div className="footer-row">
                      <div className="hotel-meta">
                        <span>קוד מלון: {hotel.raw.HotelCode}</span>
                        <span>מספר חדר: {hotel.roomId}</span>
                        <span>ספק: {hotel.provider}</span>
                      </div>

                      <button className="book-button">הזמן עכשיו</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="empty-state">
            <div className="icon">🏔️</div>
            <h3 className="title">התחל לחפש מלונות</h3>
            <p className="subtitle">מלא את פרטי החיפוש למעלה כדי למצוא מלונות מתאימים</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;