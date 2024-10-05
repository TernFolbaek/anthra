import React from 'react';
import './AdvancedSettings.css';

const AdvancedSettings: React.FC = () => {
    const [filterOption, setFilterOption] = React.useState('all');

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterOption(e.target.value);
    };

    const applyFilters = () => {
        // Implement filter functionality here
        alert(`Filters applied: ${filterOption}`);
    };

    return (
        <div className="advanced-settings">
            <h2>Advanced Settings</h2>
            <div className="form-group">
                <label>Filter Users:</label>
                <select value={filterOption} onChange={handleFilterChange}>
                    <option value="all">Show All Users</option>
                    <option value="nearby">Show Nearby Users</option>
                    <option value="online">Show Online Users</option>
                </select>
            </div>
            <button onClick={applyFilters}>Apply Filters</button>
        </div>
    );
};

export default AdvancedSettings;
