import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css';
import { useLanguage } from '../../../LanguageContext'; // Import useLanguage
import translations from '../../../languages/landingPageTranslations.json'; // Import combined translations

interface FAQItem {
    question: string;
    answer: string;
}

const FAQItemComponent: React.FC<{ item: FAQItem }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.maxHeight = isOpen ? `${contentRef.current.scrollHeight}px` : '0';
        }
    }, [isOpen]);

    return (
        <div className="border-b border-gray-200">
            <button
                className="flex justify-between items-center w-full py-4 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="faq-question">{item.question}</span>
                <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                ref={contentRef}
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: '0' }}
            >
                <p className="py-4 text-gray-600 faq-answer">{item.answer}</p>
            </div>
        </div>
    );
};

const FAQ: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const faqRef = useRef<HTMLDivElement>(null);
    const { language } = useLanguage(); // Get the current language
    const t = translations[language as keyof typeof translations].faq; // Get translations for FAQ

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1
            }
        );

        if (faqRef.current) {
            observer.observe(faqRef.current);
        }

        return () => {
            if (faqRef.current) {
                observer.unobserve(faqRef.current);
            }
        };
    }, []);

    return (
        <div className="faq-container">
            <div
                ref={faqRef}
                className={`faq-section-container transform transition-transform duration-500 ease-out ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                } max-w-2xl mx-auto mt-8`}
            >
                <div>
                    <p className="faq-section text-2xl font-bold mb-6 faq-title">{t.commonTitle}</p> {/* Translated title */}
                    <div className="space-y-2">
                        {t.commonQuestions.map((item: FAQItem, index: number) => (
                            <FAQItemComponent key={index} item={item} />
                        ))}
                    </div>
                </div>

                <div>
                    <p className="faq-section text-2xl font-bold mb-6 faq-title">{t.pricingTitle}</p> {/* Translated title */}
                    <div className="space-y-2">
                        {t.pricingQuestions.map((item: FAQItem, index: number) => (
                            <FAQItemComponent key={index} item={item} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQ;
