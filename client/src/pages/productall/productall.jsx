import React, { useEffect, useState, useCallback , useRef} from 'react';
import { IoReturnDownForwardOutline } from "react-icons/io5";
import abundance from '../../assets/images/posters/abandance.jpg';
import ShopNavber from '../../components/navber/shopnavber.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { getDesign } from '../../store/actions/design.js';
import { useNavigate } from 'react-router-dom';
import Loading from '../../components/loading.jsx';

function ProductAll() {
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const BASE_URL = 'http://localhost:8080';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const designs = useSelector((state) => state.design);

    // const lenisRef = useRef(null);
  
    // useEffect(() => {
    //   // Initialize Lenis
    //   const lenis = new Lenis({
    //     duration: 5, // Smoothness of scrolling
    //     smooth: true,
    //     lerp : 2
        
    //   });
    //   lenisRef.current = lenis;
  
    //   // Animation frame loop for Lenis
    //   const animate = (time) => {
    //     lenis.raf(time);
    //     requestAnimationFrame(animate);
    //   };
    //   requestAnimationFrame(animate);
  
    //   console.log('Lenis initialized');
  
    //   return () => {
    //     // Cleanup Lenis instance
    //     lenis.destroy();
    //   };
    // }, []);
  useEffect(() => {
    const fetchDesigns = async () => {
      if (loading) return;

      try {
        setLoading(true);
        const prevLength = designs.length;
        await dispatch(getDesign(page));
        const newLength = designs.length;
        
        if (prevLength === newLength) {
          setHasMore(false); // No more data to fetch
        }

      } catch (error) {
        console.log('Error fetching designs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigns();
  }, [page, dispatch]);

  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const goToProduct = (preDetails) => {
    navigate(`/products${preDetails.name}`, { state: { data: preDetails } });
    window.scrollTo(0 , 0)
  };

  // const getImageUrl = (image) => (image ? `${BASE_URL}${image}` : abundance);

  return (
    <div className=''>
      <div className="z-[999] sticky top-0">
        {/* <ShopNavber /> */}
      </div>
      <div className="lg:grid lg:grid-cols-6 grid grid-cols-2 gap-0">
        {designs.length === 0 && loading ? (
          <div className="h-screen w-screen flex justify-center items-center">
            <Loading />
          </div>
        ) : (
          designs.map((preDetails, index) => (
            <div
              key={preDetails.name}
              onClick={() => goToProduct(preDetails)}
              className={`z-[100] group pb-2 
                  border-[#515151] ${index % 2 === 0 ? "max-sm:border-r-[1px]" : ""} lg:border-r-[1px] lg:h-[21vw] border-b-[1px] relative flex flex-col items-center`}
            >
              <img className="object-contain  z-10 lg:size-[75%] size-[85%] mt-3 lg:mt-12 duration-300 group-hover:-translate-y-4" src={preDetails.image[0]} alt={preDetails.name} />
              <div className="absolute bottom-1 pb-1 w-[98%] flex justify-between items-center">
                <div className="flex items-center duration-300 group-hover:-translate-y-4">
                  <p className="text-white capitalize ml-1">{preDetails.name}</p>
                  <div className="bg-[#d9d9d9] ml-1 opacity-0 group-hover:opacity-100 duration-300 h-4  lg:h-[0.7vw] rounded-[2px] flex items-center justify-center">
                    <h4 className="text-black font-[inter-medium] text-[13px] lg:text-[0.7vw] tracking-tighter px-1">$25</h4>
                  </div>
                </div>
                <p className='group-hover:opacity-0'>#0{index}</p>
              </div>
              <div className="absolute bottom-1 left-1 flex opacity-0 group-hover:opacity-100 duration-300">
                <IoReturnDownForwardOutline color="white" size={20} />
                {preDetails.hastags.map((tag, tagIndex) => (
                  <p key={tagIndex} className="ml-1 max-sm:translate-y-1">#{tag}</p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {loading && (
        <div className="w-full flex justify-center items-center py-4">
          <Loading />
        </div>
      )}
    </div>
  );
}

export default ProductAll;
