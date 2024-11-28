// AdvancedSettings.tsx
import React, { useState, useRef, useEffect } from 'react';
import './AdvancedSettings.css';

interface DropdownOption {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    label: string;
    options: DropdownOption[];
    selectedOption: string;
    onSelect: (value: string) => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, options, selectedOption, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionClick = (value: string) => {
        onSelect(value);
        setIsOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedLabel = options.find(option => option.value === selectedOption)?.label || label;

    return (
        <div className="advanced-settings-dropdown" ref={dropdownRef}>
            <label className="advanced-settings-dropdown-label">{label}:</label>
            <div className="advanced-settings-dropdown-header" onClick={toggleDropdown}>
                <span>{selectedLabel}</span>
                <span className={`advanced-settings-dropdown-arrow ${isOpen ? 'open' : ''}`}>&#9660;</span>
            </div>
            {isOpen && (
                <ul className="advanced-settings-dropdown-list">
                    {options.map(option => (
                        <li
                            key={option.value}
                            className="advanced-settings-dropdown-list-item"
                            onClick={() => handleOptionClick(option.value)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const AdvancedSettings: React.FC = () => {
    const [filterOption, setFilterOption] = useState('all');
    const [distanceOption, setDistanceOption] = useState('any');
    const [institutionOption, setInstitutionOption] = useState('any');
    const [ageGroupOption, setAgeGroupOption] = useState('any');

    const handleFilterChange = (value: string) => {
        setFilterOption(value);
    };

    const handleDistanceChange = (value: string) => {
        setDistanceOption(value);
    };

    const handleInstitutionChange = (value: string) => {
        setInstitutionOption(value);
    };


    const handleAgeGroupChange = (value: string) => {
        setAgeGroupOption(value);
    };

    const applyFilters = () => {
        // Implement filter functionality here
        alert(
            `Filters applied:\n` +
            `General: ${filterOption}\n` +
            `Distance: ${distanceOption}\n` +
            `Institution: ${institutionOption}\n` +
            `Age Group: ${ageGroupOption}`
        );
    };

    // Define options for each dropdown
    const filterOptions: DropdownOption[] = [
        { label: 'Show All Users', value: 'all' },
        { label: 'Show Nearby Users', value: 'nearby' },
        { label: 'Show Online Users', value: 'online' },
    ];

    const distanceOptions: DropdownOption[] = [
        { label: 'Any Distance', value: 'any' },
        { label: 'Within 5 km', value: '5km' },
        { label: 'Within 10 km', value: '10km' },
        { label: 'Within 20 km', value: '20km' },
    ];

    const institutionOptions: DropdownOption[] = [
        { label: 'Any Institution', value: 'any' },
        { label: 'University A', value: 'university_a' },
        { label: 'University B', value: 'university_b' },
        { label: 'Institute C', value: 'institute_c' },
    ];

    const ageGroupOptions: DropdownOption[] = [
        { label: 'Any Age Group', value: 'any' },
        { label: 'Under 18', value: 'under_18' },
        { label: '18-25', value: '18_25' },
        { label: '26-35', value: '26_35' },
        { label: '36 and above', value: '36_above' },
    ];

    return (
        <div className="advanced-settings-container">
            <div className="advanced-settings-form-group">
                <CustomDropdown
                    label="Filter Users"
                    options={filterOptions}
                    selectedOption={filterOption}
                    onSelect={handleFilterChange}
                />
            </div>
            <div className="advanced-settings-form-group">
                <CustomDropdown
                    label="Distance"
                    options={distanceOptions}
                    selectedOption={distanceOption}
                    onSelect={handleDistanceChange}
                />
            </div>
            <div className="advanced-settings-form-group">
                <CustomDropdown
                    label="Institution"
                    options={institutionOptions}
                    selectedOption={institutionOption}
                    onSelect={handleInstitutionChange}
                />
            </div>
            <div className="advanced-settings-form-group">
                <CustomDropdown
                    label="Age Group"
                    options={ageGroupOptions}
                    selectedOption={ageGroupOption}
                    onSelect={handleAgeGroupChange}
                />
            </div>
            <button className="advanced-settings-apply-button" onClick={applyFilters}>
                Apply Filters
            </button>
        </div>
    );
};

export default AdvancedSettings;
