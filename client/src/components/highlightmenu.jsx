    import React, { useState, useEffect } from 'react';
    import gsap from 'gsap';

    function HighlightMenu() {
    const [boxAnnimation, setBoxAnnimation] = useState({
        line1: true,
        line2: false,
        line3: false,
        line4: false,
    });

    const features = [
        { id: 'line1', title: 'ALL WORKS' },
        { id: 'line2', title: 'POSTERS' },
        { id: 'line3', title: 'T-SHIRTS' },
        { id: 'line4', title: 'UI/UX' },
    ];

    const animateBox = (boxClassName, lineClassName, isActivate) => {
        gsap.to(`.${boxClassName}`, {
        opacity: isActivate ? 1 : 0,
        duration : .1, 
        });
        gsap.to(`.${lineClassName}`, {
        marginLeft: isActivate ? 7 : 0,
        duration : .3
        });
    };

    useEffect(() => {
        Object.keys(boxAnnimation).forEach((key) => {
        animateBox(`${key}BoxAnimation`, `${key}HeadingAnimation`, boxAnnimation[key]);
        });
    }, [boxAnnimation]);

    const handleClick = (id) => {
        console.log(id)
        setBoxAnnimation((boxes) =>
        Object.keys(boxes).reduce(
            (acc, key) => ( {

            ...acc,
            [key]: key === id, // Set only the clicked key to true, others to false
            }),
            {}
        )
        );
    };

    return (
        <div className="main">
        <div className="features">
            {features.map((el) => (
            <div key={el.id} className="flex items-center">
                <div className={`${el.id}BoxAnimation h-[9px] opacity-0 w-[9px] bg-white`}></div>
                <h5
                className={`${el.id}HeadingAnimation`}
                onClick={() => handleClick(el.id)}
                >
                {el.title}
                </h5>
            </div>
            ))}
        </div>
        </div>
    );
    }

    export default HighlightMenu;
            