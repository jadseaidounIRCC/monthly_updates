import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { ReportingPeriod } from '../types';
import ApiService from '../services/ApiService';

interface PeriodFilterProps {
  selectedPeriodId: string | null;
  onPeriodChange: (period: ReportingPeriod | null) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPeriodId,
  onPeriodChange
}) => {
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      setLoading(true);
      const periodsData = await ApiService.getReportingPeriods();
      setPeriods(periodsData);
    } catch (error) {
      console.error('Error loading periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodSelect = (period: ReportingPeriod | null) => {
    onPeriodChange(period);
    setIsOpen(false);
  };

  const formatPeriodLabel = (period: ReportingPeriod) => {
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();
    
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  };

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  return (
    <div className="period-filter">
      <label className="period-filter-label">
        <Calendar size={16} />
        Reporting Period
      </label>
      
      <div className="period-dropdown">
        <button
          className="period-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          <span className="period-selected-text">
            {loading ? 'Loading...' : 
             selectedPeriod ? formatPeriodLabel(selectedPeriod) : 
             'Select Period'}
          </span>
          <ChevronDown 
            size={16} 
            className={`period-dropdown-icon ${isOpen ? 'open' : ''}`}
          />
        </button>
        
        {isOpen && (
          <div className="period-dropdown-menu">
            <button
              className="period-dropdown-item"
              onClick={() => handlePeriodSelect(null)}
            >
              <span>All Periods</span>
            </button>
            {periods.map(period => (
              <button
                key={period.id}
                className={`period-dropdown-item ${
                  selectedPeriodId === period.id ? 'selected' : ''
                }`}
                onClick={() => handlePeriodSelect(period)}
              >
                <div className="period-item-content">
                  <span className="period-label">{formatPeriodLabel(period)}</span>
                  <span className="period-status">
                    {period.isActive ? 'Current' : 'Past'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeriodFilter;