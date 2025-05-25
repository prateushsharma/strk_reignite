// src/components/dashboard/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  BsBarChart, 
  BsTrophy, 
  BsArrowUp, 
  BsArrowDown,
  BsSearch,
  BsFilter,
  BsPeople,
  BsStar,
  BsStarFill,
  BsArrowsExpand // Using BsArrowsExpand instead of BsArrowUpDown
} from 'react-icons/bs';
import '../../styles/Leaderboard.css';

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('profitPercentage');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('30d'); // '24h', '7d', '30d', 'all'
  const [favorites, setFavorites] = useState(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Generate mock leaderboard data
  const generateMockLeaderboardData = () => {
    // Generate 30 random traders
    const traders = [];
    
    for (let i = 0; i < 30; i++) {
      const profitPercentage = (Math.random() * 200 - 50).toFixed(2);
      
      traders.push({
        id: `trader-${i + 1}`,
        rank: 0, // Will be calculated based on sorting
        name: `Trader ${i + 1}`,
        walletAddress: '0x' + Array.from({length: 40}, () => 
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        profitPercentage: parseFloat(profitPercentage),
        tradingVolume: (Math.random() * 50000 + 1000).toFixed(2),
        tradeCount: Math.floor(Math.random() * 200 + 10),
        sharpeRatio: (Math.random() * 3 + 0.1).toFixed(2),
        drawdown: (Math.random() * 30).toFixed(2),
        winRate: (Math.random() * 50 + 30).toFixed(2),
        lastActive: new Date(Date.now() - Math.random() * 604800000).toISOString() // within last week
      });
    }
    
    return traders;
  };
  
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData = generateMockLeaderboardData();
      setLeaderboardData(mockData);
      setLoading(false);
    }, 1500);
  }, [timeRange]);
  
  // Handle sorting
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc'); // Default to descending
    }
  };
  
  // Toggle favorite
  const toggleFavorite = (traderId) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(traderId)) {
        newFavorites.delete(traderId);
      } else {
        newFavorites.add(traderId);
      }
      return newFavorites;
    });
  };
  
  // Get filtered and sorted data
  const getFilteredAndSortedData = () => {
    // Filter by search query and favorites
    let filtered = leaderboardData.filter(trader => {
      const matchesSearch = !searchQuery || 
        trader.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trader.walletAddress.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFavorites = !showFavoritesOnly || favorites.has(trader.id);
      
      return matchesSearch && matchesFavorites;
    });
    
    // Sort data
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'profitPercentage':
          comparison = a.profitPercentage - b.profitPercentage;
          break;
        case 'tradingVolume':
          comparison = parseFloat(a.tradingVolume) - parseFloat(b.tradingVolume);
          break;
        case 'tradeCount':
          comparison = a.tradeCount - b.tradeCount;
          break;
        case 'sharpeRatio':
          comparison = parseFloat(a.sharpeRatio) - parseFloat(b.sharpeRatio);
          break;
        case 'drawdown':
          comparison = parseFloat(a.drawdown) - parseFloat(b.drawdown);
          break;
        case 'winRate':
          comparison = parseFloat(a.winRate) - parseFloat(b.winRate);
          break;
        case 'lastActive':
          comparison = new Date(a.lastActive) - new Date(b.lastActive);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    // Assign ranks after sorting
    filtered = filtered.map((trader, index) => ({
      ...trader,
      rank: index + 1
    }));
    
    return filtered;
  };
  
  const getSortIndicator = (column) => {
    if (sortBy !== column) return null;
    
    return (
      <span className="sort-indicator">
        {sortOrder === 'asc' ? <BsArrowUp /> : <BsArrowDown />}
      </span>
    );
  };
  
  const filteredData = getFilteredAndSortedData();
  
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="header-title">
          <BsTrophy className="title-icon" />
          <h2>Global Leaderboard</h2>
        </div>
        
        <div className="header-controls">
          <div className="time-range-selector">
            <button 
              className={`range-btn ${timeRange === '24h' ? 'active' : ''}`}
              onClick={() => setTimeRange('24h')}
            >
              24h
            </button>
            <button 
              className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7d
            </button>
            <button 
              className={`range-btn ${timeRange === '30d' ? 'active' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30d
            </button>
            <button 
              className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>
          
          <div className="search-filter">
            <div className="search-box">
              <BsSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search traders..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              className={`filter-btn ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              title={showFavoritesOnly ? 'Show all traders' : 'Show favorites only'}
            >
              <BsStar /> {showFavoritesOnly ? 'All' : 'Favorites'}
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="leaderboard-loading">
          <div className="spinner"></div>
          <p>Loading leaderboard data...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="leaderboard-empty">
          <BsPeople className="empty-icon" />
          <h3>No Traders Found</h3>
          <p>No traders match your search criteria.</p>
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          )}
          {showFavoritesOnly && (
            <button 
              className="show-all-btn"
              onClick={() => setShowFavoritesOnly(false)}
            >
              Show All Traders
            </button>
          )}
        </div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="favorite-col"></th>
                <th 
                  className={`rank-col ${sortBy === 'rank' ? 'sorted' : ''}`}
                  onClick={() => handleSort('rank')}
                >
                  Rank {getSortIndicator('rank')}
                </th>
                <th 
                  className={`name-col ${sortBy === 'name' ? 'sorted' : ''}`}
                  onClick={() => handleSort('name')}
                >
                  Trader {getSortIndicator('name')}
                </th>
                <th 
                  className={`profit-col ${sortBy === 'profitPercentage' ? 'sorted' : ''}`}
                  onClick={() => handleSort('profitPercentage')}
                >
                  Profit % {getSortIndicator('profitPercentage')}
                </th>
                <th 
                  className={`volume-col ${sortBy === 'tradingVolume' ? 'sorted' : ''}`}
                  onClick={() => handleSort('tradingVolume')}
                >
                  Volume {getSortIndicator('tradingVolume')}
                </th>
                <th 
                  className={`trades-col ${sortBy === 'tradeCount' ? 'sorted' : ''}`}
                  onClick={() => handleSort('tradeCount')}
                >
                  Trades {getSortIndicator('tradeCount')}
                </th>
                <th 
                  className={`sharpe-col ${sortBy === 'sharpeRatio' ? 'sorted' : ''}`}
                  onClick={() => handleSort('sharpeRatio')}
                >
                  Sharpe {getSortIndicator('sharpeRatio')}
                </th>
                <th 
                  className={`drawdown-col ${sortBy === 'drawdown' ? 'sorted' : ''}`}
                  onClick={() => handleSort('drawdown')}
                >
                  Drawdown {getSortIndicator('drawdown')}
                </th>
                <th 
                  className={`winrate-col ${sortBy === 'winRate' ? 'sorted' : ''}`}
                  onClick={() => handleSort('winRate')}
                >
                  Win Rate {getSortIndicator('winRate')}
                </th>
                <th 
                  className={`active-col ${sortBy === 'lastActive' ? 'sorted' : ''}`}
                  onClick={() => handleSort('lastActive')}
                >
                  Last Active {getSortIndicator('lastActive')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(trader => (
                <tr key={trader.id} className={trader.rank <= 3 ? `top-${trader.rank}` : ''}>
                  <td className="favorite-cell">
                    <button 
                      className="favorite-btn"
                      onClick={() => toggleFavorite(trader.id)}
                      title={favorites.has(trader.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {favorites.has(trader.id) ? <BsStarFill /> : <BsStar />}
                    </button>
                  </td>
                  <td className="rank-cell">
                    {trader.rank <= 3 ? (
                      <div className={`rank-badge rank-${trader.rank}`}>
                        {trader.rank}
                      </div>
                    ) : (
                      trader.rank
                    )}
                  </td>
                  <td className="name-cell">
                    <div className="trader-name">{trader.name}</div>
                    <div className="trader-address">
                      {`${trader.walletAddress.substring(0, 6)}...${trader.walletAddress.substring(trader.walletAddress.length - 4)}`}
                    </div>
                  </td>
                  <td className={`profit-cell ${trader.profitPercentage >= 0 ? 'positive' : 'negative'}`}>
                    {trader.profitPercentage >= 0 ? '+' : ''}{trader.profitPercentage}%
                  </td>
                  <td className="volume-cell">${parseFloat(trader.tradingVolume).toLocaleString()}</td>
                  <td className="trades-cell">{trader.tradeCount}</td>
                  <td className="sharpe-cell">{trader.sharpeRatio}</td>
                  <td className="drawdown-cell">{trader.drawdown}%</td>
                  <td className="winrate-cell">{trader.winRate}%</td>
                  <td className="active-cell">
                    {new Date(trader.lastActive).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="leaderboard-footer">
        <div className="footer-stats">
          <span>Showing {filteredData.length} of {leaderboardData.length} traders</span>
          {searchQuery && <span> | Filtered by: "{searchQuery}"</span>}
          {showFavoritesOnly && <span> | Showing favorites only</span>}
        </div>
        
        <div className="footer-info">
          <span className="info-label">Metrics:</span>
          <span className="info-text">Sharpe Ratio = Returns vs Volatility | Max Drawdown = Largest Peak-to-Valley Decline</span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;