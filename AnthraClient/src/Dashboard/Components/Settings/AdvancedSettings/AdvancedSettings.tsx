// AdvancedSettings.tsx
import React, { useState } from 'react';
import './AdvancedSettings.css';
import RangeSlider from './RangeSlider';

const AdvancedSettings: React.FC = () => {
    const [distanceRange, setDistanceRange] = useState({ min: 0, max: 20 });
    const [ageRange, setAgeRange] = useState({ min: 0, max: 100 });
    const notReadyFlag = true;

    const handleDistanceChange = (min: number, max: number) => {
        setDistanceRange({ min, max });
    };

    const handleAgeChange = (min: number, max: number) => {
        setAgeRange({ min, max });
    };

    const applyFilters = () => {
        // Implementation of filter application
    };

    return (
        <div className="advanced-settings-container p-3 rounded-lg">
            {notReadyFlag ? (
                <div className="text-sm dark:text-gray-200 text-gray-600 text-center font-medium">Awaiting more users to make filtering available :)</div>
            ) : (
                <>
                    <div className="advanced-settings-form-group dark:text-white">
                        <RangeSlider
                            label="Distance (km)"
                            min={0}
                            max={50}
                            step={1}
                            minValue={distanceRange.min}
                            maxValue={distanceRange.max}
                            onChange={handleDistanceChange}
                        />
                    </div>
                    <div className="advanced-settings-form-group">
                        <RangeSlider
                            label="Age"
                            min={0}
                            max={100}
                            step={1}
                            minValue={ageRange.min}
                            maxValue={ageRange.max}
                            onChange={handleAgeChange}
                        />
                    </div>
                    <button
                        className="text-sm advanced-settings-apply-button bg-emerald-400"
                        onClick={applyFilters}
                    >
                        Apply
                    </button>
                </>
            )}
        </div>
    );
};

export default AdvancedSettings;
