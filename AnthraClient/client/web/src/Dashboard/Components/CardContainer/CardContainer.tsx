// Components/CardContainer/CardContainer.tsx
import React from 'react';
import './CardContainer.css';

interface CardContainerProps {
    title: string;
    children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({ title, children }) => {
    return (
        <div className="card-container">
            <p className="card-title">{title}</p>
            <div>{children}</div>
        </div>
    );
};

export default CardContainer;
