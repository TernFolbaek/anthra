import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import CropModal from './CropModal';
import './CreateProfile.css';

interface StepOneProps {
    firstName: string;
    setFirstName: React.Dispatch<React.SetStateAction<string>>;
    setAboutMe: React.Dispatch<React.SetStateAction<string>>;
    aboutMe: string;
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
                                             setAboutMe,
                                             aboutMe
                                         }) => {
    const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
    const [countries, setCountries] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const countryInputRef = useRef<HTMLDivElement>(null);
    const cityInputRef = useRef<HTMLDivElement>(null);
    const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(-1);
    const [selectedCityIndex, setSelectedCityIndex] = useState<number>(-1);

    const [previewUrl, setPreviewUrl] = useState<string | null>(
        profilePictureFile ? URL.createObjectURL(profilePictureFile) : null
    );

    const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<string>('');

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
                setSelectedCountryIndex(-1);
                setSelectedCityIndex(-1);
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
            setSelectedCityIndex(-1);
            return;
        }

        const suggestions = cities
            .filter((cityName) => cityName.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 5);

        setCitySuggestions(suggestions);
        setSelectedCityIndex(suggestions.length > 0 ? 0 : -1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    setSelectedImage(reader.result as string);
                    setIsCropModalOpen(true);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = (croppedImage: Blob | null) => {
        if (croppedImage) {
            const croppedFile = new File([croppedImage], 'profilePicture.jpg', {
                type: 'image/jpeg',
            });
            setProfilePictureFile(croppedFile);
            setPreviewUrl(URL.createObjectURL(croppedImage));
        }
    };

    const handleCropModalClose = () => {
        setIsCropModalOpen(false);
        setSelectedImage('');
    };

    const handleCitySelect = (cityName: string) => {
        setCity(cityName);
        setCitySuggestions([]);
        setSelectedCityIndex(-1);
    };

    const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCountry(value);

        if (value.trim() === '') {
            setCountrySuggestions([]);
            setSelectedCountryIndex(-1);
            return;
        }

        const suggestions = countries
            .filter((countryName) => countryName.toLowerCase().startsWith(value.toLowerCase()))
            .slice(0, 5);

        setCountrySuggestions(suggestions);
        setSelectedCountryIndex(suggestions.length > 0 ? 0 : -1);
    };

    const handleCountrySelect = (countryName: string) => {
        setCountry(countryName);
        setCountrySuggestions([]);
        setSelectedCountryIndex(-1);

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

    const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (countrySuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCountryIndex((prevIndex) =>
                prevIndex + 1 < countrySuggestions.length ? prevIndex + 1 : prevIndex
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCountryIndex((prevIndex) =>
                prevIndex > 0 ? prevIndex - 1 : 0
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedCountryIndex >= 0 && selectedCountryIndex < countrySuggestions.length) {
                handleCountrySelect(countrySuggestions[selectedCountryIndex]);
            } else if (countrySuggestions.length > 0) {
                // fallback to first suggestion if none selected
                handleCountrySelect(countrySuggestions[0]);
            }
        }
    };

    const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (citySuggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedCityIndex((prevIndex) =>
                prevIndex + 1 < citySuggestions.length ? prevIndex + 1 : prevIndex
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedCityIndex((prevIndex) =>
                prevIndex > 0 ? prevIndex - 1 : 0
            );
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedCityIndex >= 0 && selectedCityIndex < citySuggestions.length) {
                handleCitySelect(citySuggestions[selectedCityIndex]);
            } else if (citySuggestions.length > 0) {
                // fallback to first suggestion if none selected
                handleCitySelect(citySuggestions[0]);
            }
        }
    };

    const handleCountryBlur = () => {
        // If the entered country isn't a valid one from the list, reset it
        if (country && !countries.includes(country)) {
            setCountry('');
        }
    };

    return (
        <div className="form-step">
            <div className="flex items-center mb-2">
                <label htmlFor="firstName" className="w-1/3">
                    First Name<span className="required-asterisk">*</span>
                </label>
                <input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
            </div>

            <div className="flex items-center mb-2">
                <label htmlFor="lastName" className="w-1/3">
                    Last Name<span className="required-asterisk">*</span>
                </label>
                <input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
            </div>

            <div className="flex items-center mb-2">
                <label htmlFor="age" className="w-1/3">
                    Age<span className="required-asterisk">*</span>
                </label>
                <input
                    id="age"
                    type="number"
                    placeholder="Age"
                    value={age === '' ? '' : age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                />
            </div>

            {/* Country Input */}
            <div className="autocomplete-container mb-2" ref={countryInputRef}>
                <div className="autocomplete-input-with-label">
                    <label htmlFor="country" className="w-1/3">
                        Country<span className="required-asterisk">*</span>
                    </label>
                    <input
                        id="country"
                        type="text"
                        placeholder="Country"
                        autoComplete="nope"
                        value={country}
                        onChange={handleCountryInputChange}
                        onKeyDown={handleCountryKeyDown}
                        onBlur={handleCountryBlur}
                    />
                </div>
                {countrySuggestions.length > 0 && (
                    <ul className="uni-dropdown-menu">
                        {countrySuggestions.map((countryName, index) => (
                            <li
                                className={`suggestion-item ${index === selectedCountryIndex ? 'bg-gray-200' : ''}`}
                                key={index}
                                onMouseDown={() => handleCountrySelect(countryName)}
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
                    <label htmlFor="city" className="w-1/3">
                        City<span className="required-asterisk">*</span>
                    </label>
                    <input
                        id="city"
                        type="text"
                        placeholder="City"
                        autoComplete="nope"
                        value={city}
                        onChange={handleCityInputChange}
                        onKeyDown={handleCityKeyDown}
                    />
                </div>
                {citySuggestions.length > 0 && (
                    <ul className="uni-dropdown-menu">
                        {citySuggestions.map((cityName, index) => (
                            <li
                                className={`suggestion-item ${index === selectedCityIndex ? 'bg-gray-200' : ''}`}
                                key={index}
                                onMouseDown={() => handleCitySelect(cityName)}
                            >
                                {cityName}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <label htmlFor="aboutMe" className="input-label">
                About Me <span className="required-asterisk">*</span>
                <span className="font-medium text-xs"> min. 150 chars.</span>
            </label>
            <div className="textarea-with-counter">
                <div className="char-counter">{aboutMe.length}/300</div>
                <textarea
                    id="aboutMe"
                    placeholder="About Me"
                    minLength={150}
                    maxLength={300}
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                />
            </div>


            <label htmlFor="profilePicture">
                Profile Picture<span className="required-asterisk">*</span>
            </label>
            <div className="profile-picture-picker">
                <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                />
                <label htmlFor="profilePicture" className="file-input-label">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profile Preview" className="image-preview"/>
                    ) : (
                        <span className="placeholder-text">Click to upload</span>
                    )}
                </label>
            </div>

            {/* Crop Modal */}
            {isCropModalOpen && (
                <CropModal
                    isOpen={isCropModalOpen}
                    imageSrc={selectedImage}
                    onClose={handleCropModalClose}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
};

export default StepOne;
