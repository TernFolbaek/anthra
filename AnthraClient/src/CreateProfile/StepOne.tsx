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
    onNext: () => void;
    error: string | null;
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
                                             aboutMe,
                                             onNext,
                                             error
                                         }) => {
    // State for countries, cities, suggestions, etc.
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
            const maxSizeInBytes = 4 * 1024 * 1024;
            if (file.size > maxSizeInBytes) {
                alert("File size must be less than 4MB.");
                e.target.value = "";
                return;
            }
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

        axios
            .post(
                'https://countriesnow.space/api/v0.1/countries/cities',
                { country: countryName },
                { withCredentials: false }
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
                handleCitySelect(citySuggestions[0]);
            }
        }
    };

    const handleCountryBlur = () => {
        if (country && !countries.includes(country)) {
            setCountry('');
        }
    };
    const onNextClick = (e: any) => {
        e.preventDefault();
        onNext();
    }


    return (
            <div className="form-step w-full">
                <div className="flex gap-2 mt-1">
                    <div className="floating-label-group flex-1">
                        <input
                            id="firstName"
                            name="firstName"
                            autoComplete="lol"
                            type="text"
                            maxLength={20}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="floating-label-input"
                            placeholder=" "
                        />
                        <label htmlFor="firstName" className="floating-label">First Name</label>
                    </div>
                    <div className="floating-label-group flex-1">
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            autoComplete="false"
                            maxLength={20}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="floating-label-input"
                            placeholder=" "
                        />
                        <label htmlFor="lastName" className="floating-label">Last Name</label>
                    </div>
                </div>

                <div className="floating-label-group mt-1 age-group">
                    <input
                        id="age"
                        type="number"
                        autoComplete="false"
                        value={age === '' ? '' : age}
                        onChange={(e) =>
                            setAge(e.target.value === '' ? '' : parseInt(e.target.value))
                        }
                        className="floating-label-input"
                        placeholder=" "
                    />
                    <label htmlFor="age" className="floating-label">Age</label>
                </div>
                <div className="flex gap-2 mt-1">
                    <div className="autocomplete-container flex-1 mb-4" ref={countryInputRef}>
                        <input
                            id="country"
                            type="text"
                            name="country"
                            autoComplete="false"
                            value={country}
                            onChange={handleCountryInputChange}
                            onKeyDown={handleCountryKeyDown}
                            onBlur={handleCountryBlur}
                            className="floating-label-input"
                            placeholder=" "
                        />
                        <label htmlFor="country" className="floating-label">Country</label>
                        {countrySuggestions.length > 0 && (
                            <ul className="uni-dropdown-menu">
                                {countrySuggestions.map((countryName, index) => (
                                    <li
                                        className={`suggestion-item ${index === selectedCountryIndex ? 'active' : ''}`}
                                        key={index}
                                        onMouseDown={() => handleCountrySelect(countryName)}
                                    >
                                        {countryName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>


                    <div className="floating-label-group flex-1" ref={cityInputRef}>
                        <input
                            id="city"
                            type="text"
                            autoComplete="off"
                            value={city}
                            onChange={handleCityInputChange}
                            onKeyDown={handleCityKeyDown}
                            disabled={!country}

                            className="floating-label-input disabled:bg-gray-700/30 disabled:cursor-not-allowed"
                            placeholder=" "
                        />
                        <label htmlFor="city" className="floating-label">City</label>
                        {citySuggestions.length > 0 && (
                            <ul className="uni-dropdown-menu">
                                {citySuggestions.map((cityName, index) => (
                                    <li
                                        className={`suggestion-item ${index === selectedCityIndex ? 'active' : ''}`}
                                        key={index}
                                        onMouseDown={() => handleCitySelect(cityName)}
                                    >
                                        {cityName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>


                {/* About Me textarea with character counter */}
                <div className="floating-label-group mt-2 textarea-group">
        <textarea
            id="aboutMe"
            minLength={60}
            maxLength={300}
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            className="floating-label-input textarea-input"
            placeholder=" "
        />
                    <label htmlFor="aboutMe" className="floating-label">About Yourself</label>
                    <div className="char-counter flex gap-2 items-center text-gray-200">{aboutMe.length}/300 <p
                        className="text-xs">min 60 cha.</p></div>
                </div>

                {/* Profile Picture Picker */}
                <label htmlFor="profilePicture" id="profile-picture-label" className="profile-picture-label">
                    Profile Picture
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
                <div className="create-profile-button-container">
                    <button
                        type="submit"
                        onClick={(e)=>onNextClick(e)}
                        className="create-profile-next-button w-[80px] bg-emerald-400/20  transform hover:scale-105 text-emerald-400"
                    >
                        Next
                    </button>
                </div>
                <p className="text-sm text-white text-center mt-1">{error}</p>
            </div>
            );
            };

            export default StepOne;
