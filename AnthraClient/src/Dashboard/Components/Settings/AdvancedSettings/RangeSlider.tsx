// RangeSlider.tsx
import React from 'react';
import './RangeSlider.css';

interface RangeSliderProps {
    label: string;
    min: number;
    max: number;
    step?: number;
    minValue: number;
    maxValue: number;
    onChange: (min: number, max: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
                                                     label,
                                                     min,
                                                     max,
                                                     step = 1,
                                                     minValue,
                                                     maxValue,
                                                     onChange
                                                 }) => {

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(e.target.value), maxValue - step);
        onChange(value, maxValue);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(e.target.value), minValue + step);
        onChange(minValue, value);
    };

    return (
        <div className="range-slider-container">
            <p className="dark:text-white range-slider-label mb-4">{label}:</p>
            <div className="range-slider">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minValue}
                    onChange={handleMinChange}
                    className="z-10 thumb thumb--left"
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxValue}
                    onChange={handleMaxChange}
                    className="z-10 thumb thumb--right"
                />

                <div >
                    <div className="slider__track "></div>
                    <div
                        className="slider__range z-1 "
                        style={{
                            left: `${((minValue - min) / (max - min)) * 100}%`,
                            right: `${100 - ((maxValue - min) / (max - min)) * 100}%`,
                        }}
                    ></div>
                    <div className="dark:text-white slider__left-value">{minValue}</div>
                    <div className="dark:text-white slider__right-value">{maxValue}</div>
                </div>
            </div>
        </div>
    );
};

export default RangeSlider;
