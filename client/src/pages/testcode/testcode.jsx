import { useState } from "react";
import { useSprings, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import image1 from "../../assets/images/posters/freedom.webp";
import image2 from "../../assets/images/posters/freedom.webp";

const images = [image1, image2 , image1];

const DraggableCarousel = () => {
  const [index, setIndex] = useState(0);

  // Animation for image positions
  const [springs, api] = useSprings(images.length, (i) => ({
    x: i * window.innerWidth,
  }));

  const bind = useDrag(({ active, movement: [mx], direction: [xDir], velocity, cancel }) => {
    if (!active) {
      let newIndex = index;

      if (velocity > 0.2) {
        newIndex = index + (xDir > 0 ? -1 : 1);
      }

      newIndex = Math.max(0, Math.min(newIndex, images.length - 1));
      setIndex(newIndex);

      api.start((i) => ({
        x: (i - newIndex) * window.innerWidth,
      }));
    } else {
      api.start((i) => ({
        x: (i - index) * window.innerWidth + mx,
      }));
    }
  });

  return (
    <div className="overflow-hidden w-full h-screen relative">
      {springs.map((style, i) => (
        <animated.div
          key={i}
          {...bind()}
          className="absolute w-full h-full bg-cover bg-center"
          style={{ ...style, backgroundImage: `url(${images[i]})` }}
        />
      ))}
    </div>
  );
};

export default DraggableCarousel;
