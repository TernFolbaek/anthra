// StepOne.tsx

import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface StepOneProps {
    firstName: string;
    setFirstName: React.Dispatch<React.SetStateAction<string>>;
    lastName: string;
    setLastName: React.Dispatch<React.SetStateAction<string>>;
    age: number | '';
    setAge: React.Dispatch<React.SetStateAction<number | ''>>;
    country: string;
    setCountry: React.Dispatch<React.SetStateAction<string>>;
    city: string;
    setCity: React.Dispatch<React.SetStateAction<string>>;
    profilePictureFile: File | null;
    setProfilePictureFile: React.Dispatch<React.SetStateAction<File | null>>;
}

const StepOne: React.FC<StepOneProps> = ({
                                             firstName,
                                             setFirstName,
                                             lastName,
                                             setLastName,
                                             age,
                                             setAge,
                                             country,
                                             setCountry,
                                             city,
                                             setCity,
                                             profilePictureFile,
                                             setProfilePictureFile,
                                         }) => {
    const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const countryInputRef = useRef<HTMLInputElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch countries on component mount
    useEffect(() => {
        axios
            .get('https://countriesnow.space/api/v0.1/countries/iso', {
                withCredentials: false,
            })
            .then((response) => {
                const countryList = response.data.data.map((country: any) => country.name);
                setCountries(countryList);
            })
            .catch((error) => {
                console.error('Error fetching countries:', error);
            });
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                countryInputRef.current &&
                !countryInputRef.current.contains(event.target as Node) &&
                cityInputRef.current &&
                !cityInputRef.current.contains(event.target as Node)
            ) {
                setCountrySuggestions([]);
                setCitySuggestions([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle city input change
    const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCity(value);

        if (value.trim() === '') {
            setCitySuggestions([]);
            return;
        }

        const suggestions = cities
            .filter((cityName) => cityName.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 5);

        setCitySuggestions(suggestions);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfilePictureFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCitySelect = (cityName: string) => {
        setCity(cityName);
        setCitySuggestions([]);
    };

    const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCountry(value);

        if (value.trim() === '') {
            setCountrySuggestions([]);
            return;
        }

        const suggestions = countries
            .filter((countryName) => countryName.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 5);

        setCountrySuggestions(suggestions);
    };

    const handleCountrySelect = (countryName: string) => {
        setCountry(countryName);
        setCountrySuggestions([]);

        // Fetch cities for the selected country
        axios
            .post(
                'https://countriesnow.space/api/v0.1/countries/cities',
                {
                    country: countryName,
                },
                {
                    withCredentials: false,
                }
            )
            .then((response) => {
                const cityList = response.data.data;
                setCities(cityList);
            })
            .catch((error) => {
                console.error('Error fetching cities:', error);
            });
    };

    return (
        <div className="form-step">
            <label htmlFor="firstName" className="input-label">
                First Name<span className="required-asterisk">*</span>
            </label>
            <input
                id="firstName"
                type="text"
                placeholder="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />

            <label htmlFor="lastName" className="input-label">
                Last Name<span className="required-asterisk">*</span>
            </label>
            <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />

            <label htmlFor="age" className="input-label">
                Age<span className="required-asterisk">*</span>
            </label>
            <input
                id="age"
                type="number"
                placeholder="Age"
                required
                value={age === '' ? '' : age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
            />

            {/* Country Input */}
            <div className="autocomplete-container mt-2" ref={countryInputRef}>
                <div className="autocomplete-input-with-label">
                    <label htmlFor="country" className="input-label">
                        Country<span className="required-asterisk">*</span>
                    </label>
                    <input
                        id="country"
                        type="text"
                        placeholder="Country"
                        required
                        value={country}
                        onChange={handleCountryInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (countrySuggestions.length > 0) {
                                    handleCountrySelect(countrySuggestions[0]);
                                }
                            }
                        }}
                    />
                </div>
                {countrySuggestions.length > 0 && (
                    <ul className="suggestions-list">
                        {countrySuggestions.map((countryName, index) => (
                            <li
                                className="suggestion-item"
                                key={index}
                                onClick={() => handleCountrySelect(countryName)}
                            >
                                {countryName}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* City Input */}
            <div className="autocomplete-container" ref={cityInputRef}>
                <div className="autocomplete-input-with-label">
                    <label htmlFor="city" className="input-label">
                        City<span className="required-asterisk">*</span>
                    </label>
                    <input
                        id="city"
                        type="text"
                        placeholder="City"
                        required
                        value={city}
                        onChange={handleCityInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (citySuggestions.length > 0) {
                                    handleCitySelect(citySuggestions[0]);
                                }
                            }
                        }}
                    />
                </div>
                {citySuggestions.length > 0 && (
                    <ul className="suggestions-list">
                        {citySuggestions.map((cityName, index) => (
                            <li
                                className="suggestion-item"
                                key={index}
                                onClick={() => handleCitySelect(cityName)}
                            >
                                {cityName}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <label htmlFor="profilePicture" className="input-label">
                Profile Picture<span className="required-asterisk">*</span>
            </label>
            <input
                id="profilePicture"
                type="file"
                accept="image/*"
                required
                onChange={handleFileChange}
                className="choose-pfp mb-2"
            />
            <div className="w-full flex justify-center">
                {previewUrl && <img src={previewUrl} alt="Preview" className="image-preview" />}
            </div>
        </div>
    );
};

export default StepOne;
