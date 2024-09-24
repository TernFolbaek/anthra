import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import './FAQ.css'
interface FAQItem {
    question: string;
    answer: string;
}

const faqCommonData : FAQItem[] = [
    {
        question: 'Who uses Anthra?',
        answer: 'Anthra is a service used by a wide demographic, the service is for anyone who wants to delve further into their field with the company of a partner, collaborator or study buddy, whatever fits your needs'
    },
    {
        question: 'How do i make new connections?',
        answer: 'Send connection requests and await their response, connection requests from users that wish to reach out to you will be shown in your inbox where you can decide to connect or decline',
    },
    {
        question: 'Why?',
        answer: 'Everyone has a passion, a niche topic of interest, finding someone or a group of people with the same intrigue tends to create a reciprocal relationship of discipline and a further development of enjoyment to the subject',
    },
]
const faqPricingData: FAQItem[] = [
    {
        question: "Does it require a subscription?",
        answer: "No. There are no inbuilt payments into the service"
    },
    {
        question: "Are there premium features?",
        answer: "Not yet, but our team is working on implementing user feedback which we have received along our journey"
    },

];

const FAQItem: React.FC<{ item: FAQItem }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.style.maxHeight = isOpen ? `${contentRef.current.scrollHeight}px` : '0';
        }
    }, [isOpen]);

    return (
            <div className="border-b border-gray-200 ">
                <button
                    className="flex justify-between items-center w-full py-4 text-left"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="faq-question">{item.question}</span>
                    <ChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}/>
                </button>
                <div
                    ref={contentRef}
                    className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                    style={{maxHeight: '0'}}
                >
                    <p className="py-4 text-gray-600 faq-answer">{item.answer}</p>
                </div>
            </div>
    );
};

const FAQ: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const faqRef = useRef<HTMLDivElement>(null);

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
                className={`faq-section-container transform transition-transform duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} max-w-2xl mx-auto mt-8`}
            >
                <div>
                    <h2 className="faq-section text-2xl font-bold mb-6 faq-title">Common Questions</h2>
                    <div className="space-y-2">
                        {faqCommonData.map((item, index) => (
                            <FAQItem key={index} item={item}/>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="faq-section text-2xl font-bold mb-6 faq-title">Pricing</h2>
                    <div className="space-y-2">
                        {faqPricingData.map((item, index) => (
                            <FAQItem key={index} item={item}/>
                        ))}
                    </div>
                </div>

            </div>

        </div>

    );
};

export default FAQ;