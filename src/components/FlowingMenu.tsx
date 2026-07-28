import React from 'react';
import { gsap } from 'gsap';

interface MenuItemProps {
  link: string;
  text: string;
  image: string;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
  return (
    <div className="w-full h-full overflow-hidden">
      <nav className="flex flex-col h-full m-0 p-0">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ link, text, image }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);

  const animationDefaults = { duration: 0.6, ease: 'expo' };

  const findClosestEdge = (mouseX: number, mouseY: number, width: number, height: number): 'top' | 'bottom' => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.set(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' })
      .set(marqueeInnerRef.current, { y: edge === 'top' ? '101%' : '-101%' })
      .to([marqueeRef.current, marqueeInnerRef.current], { y: '0%' });
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(ev.clientX - rect.left, ev.clientY - rect.top, rect.width, rect.height);

    const tl = gsap.timeline({ defaults: animationDefaults }) as gsap.core.Timeline;
    tl.to(marqueeRef.current, { y: edge === 'top' ? '-101%' : '101%' }).to(marqueeInnerRef.current, {
      y: edge === 'top' ? '101%' : '-101%'
    });
  };

  // Create 40 repetitions for continuous scrolling
  const repeatedMarqueeContent = React.useMemo(() => {
    return Array.from({ length: 40 }).map((_, idx) => (
      <React.Fragment key={idx}>
        <span className="text-black uppercase font-normal text-[3vh] leading-[1.2] p-[0.3vh_0.3vw_0] whitespace-nowrap">{text}</span>
        <div
          className="w-[150px] h-[5vh] my-[0.7em] mx-[0.7vw] p-[0.3em_0] rounded-[30px] bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      </React.Fragment>
    ));
  }, [text, image]);

  // Start the continuous marquee animation when component mounts
  React.useEffect(() => {
    if (marqueeInnerRef.current) {
      // Clone the content to create a seamless loop
      const marqueeContent = marqueeInnerRef.current.innerHTML;
      marqueeInnerRef.current.innerHTML = marqueeContent + marqueeContent;
      
      // Create infinite scrolling animation using CSS keyframes
      const animation = marqueeInnerRef.current.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-50%)' }
        ],
        {
          duration: 10000,
          iterations: Infinity,
          easing: 'linear'
        }
      );

      return () => {
        animation.cancel();
      };
    }
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden text-center -mt-px" ref={itemRef}>
      <div
        className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-yellow-400 translate-y-[101%]"
        ref={marqueeRef}
      >
        <div className="h-full w-[200%] flex" ref={marqueeInnerRef}>
          <div className="flex items-center h-full will-change-transform">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowingMenu;