import React, { useState } from "react";
import TagInput from "../../components/inputs/taginput.jsx";
import ImageInput from "../../components/inputs/imageInput.jsx";
import { useDispatch } from "react-redux";
import { postDesign } from "../../store/actions/design.js";

function AdminAddProduct() {
  const dispatch = useDispatch();

  let [name, setName] = useState("");
  let [headline, setHeadline] = useState("");
  let [amount, setAmount] = useState("");
  const [error , setError] = useState('please fill the content')

  const [sections, setSections] = useState([
    { title: "", content: ["", ""] },
  ]);
const [hastags, setHastags] = useState(['dark', 'aesthetic']);


  // let [cashOnDelivery, setCashOnDelivery] = useState("");
  // let [returnOnDelivery, setReturnOnDelivery] = useState("");
  // let [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [image, setSelectedImage] = useState([]);

  const addSections = () => {
    setSections([
      ...sections,
      { title: ``, content: [] },
    ]);
  };



  const addContent = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].content.push(
      ``
    );
    setSections(updatedSections);
  };

const deleteContent = (sectionIndex , contentIndex)=>{
  setSections((prev) => 
    prev.map((section, i) => {
      if (i === sectionIndex) {

        const newContent = section.content.filter((_, idx) => idx !== contentIndex);
        console.log(newContent)
        return { ...section, content: newContent }; // return updated section
      }
      return section; // return other sections unchanged
    })
  );
}

const deleteSection = ()=>{
  console.log('section deleted')
  
setSections((section)=>{
  if(section.length > 1){

    return section.slice(0 , -1)
  } 
  return section
})
}
  const formSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("headline", headline);
    formData.append("amount", amount);
    // formData.append("cashOnDelivery", cashOnDelivery);
    // formData.append("returnOnDelivery", returnOnDelivery);
    // formData.append("expectedDeliveryDate", expectedDeliveryDate);

    // Append images properly
    if (image.length > 0) {
      image.forEach((file) => {
        formData.append("images", file);
      });
    } else {
      console.warn("No images selected!");
    }

    // Append JSON string data
    formData.append("sections", JSON.stringify(sections));
    formData.append("hastags", JSON.stringify(hastags));

    console.log("FormData before submitting:", Object.fromEntries(formData)); // Debugging

    dispatch(postDesign(formData));
  };

  return (
    <div>
      <h1 className="mb-20 mt-5">Admin panel</h1>

      <form onSubmit={formSubmit}>
        <div className="flex gap-1">

        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="bg-transparent w-[70%] py-[3px] border-[#424242] px-1 mb-2 border rounded lg:w-[15vw]"
          />
         <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="$"
          className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border  rounded  w-[15vw] lg:w-[4vw]"
          />
          </div>


        <ImageInput selectedImage={image} setSelectedImage={setSelectedImage} />

       
        <textarea rows={2} cols = {2}
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          className=" bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[70%] lg:w-[15vw]"
        />

        <div className="other-information lg:mt-20 lg:mb-32">
          <h3 className="lg:mb-8 mb-2">Section Info:</h3>

          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="w-full lg:mb-7 pt-3 lg:p-3">
              <input
                type="text"
                placeholder="Title"
                className="bg-transparent w-full py-[3px] border-[#424242]  px-1 mb-2 border rounded lg:w-[15vw]"
                value={section.title}
                onChange={(e) => {
                  const updatedSections = [...sections];
                  updatedSections[sectionIndex].title = e.target.value;
                  setSections(updatedSections);
                }}
              />

              {section.content.map((cont, contentIndex , contArr) => (
                <div className="flex">

                <textarea
                  key={contentIndex}
                  type="text"
                  placeholder="Content"
                  className="bg-transparent w-full py-[3px] border-[#424242] px-1 lg:mb-2 border rounded lg:w-[15vw]"
                  value={cont}
                  onChange={(e) => {
                    const updatedSections = [...sections];
                    updatedSections[sectionIndex].content[contentIndex] = e.target.value;
                    setSections(updatedSections);
                  }}
                  />
                  <button className="bg-white mr-2 ml-2 text-black mt-5 rounded p-1 font-[inter-regular]" type="button" onClick={()=>{deleteContent(sectionIndex , contentIndex)}}>del</button>

                  </div>
              ))}
<div className = 'flex w-full justify-between'>
  <p className="text-red-500">please fill the {'contern'}</p>

              <button
                type="button"
                onClick={() => addContent(sectionIndex)}
                className="bg-white mt-3  text-black font-[inter-regular] p-1 ml-2  lg:mt-4 rounded"
                >
                Add Content
              </button>
                </div>
            </div>
          ))}
<div className="flex w-full mb-10 justify-start">

          <button
            type="button"
            onClick={deleteSection}
            className="bg-white mr-2 text-black mt-5 rounded p-1 font-[inter-regular]"
            >
            delete Section
          </button>
          <button
            type="button"
            onClick={addSections}
            className="bg-white text-black mt-5 rounded p-1 font-[inter-regular]"
            >
            Add Section
          </button>
            </div>
        </div>

        <div>
          <TagInput  hastags = {hastags} setHastags = {setHastags}/>
        </div>

        {/* <div>
          <h3 className="mb-12 mt-12">Other Information:</h3>
          <div className="flex mr-2 items-center">
            <div>Expected Delivery Date:</div>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]"
            />
          </div>

          <div className="cashondelivery flex gap-3 mt-3">
            <h6>Cash on Delivery:</h6>
            <label>
              <input
                type="radio"
                name="cash_on_delivery"
                value="yes"
                checked={cashOnDelivery === "yes"}
                onChange={(e) => setCashOnDelivery(e.target.value)}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="cash_on_delivery"
                value="no"
                checked={cashOnDelivery === "no"}
                onChange={(e) => setCashOnDelivery(e.target.value)}
              />
              No
            </label>
          </div>

          <div className="returnondelivery flex gap-3 mt-3">
            <h6>Return on Delivery:</h6>
            <label>
              <input
                type="radio"
                name="return_on_delivery"
                value="yes"
                checked={returnOnDelivery === "yes"}
                onChange={(e) => setReturnOnDelivery(e.target.value)}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="return_on_delivery"
                value="no"
                checked={returnOnDelivery === "no"}
                onChange={(e) => setReturnOnDelivery(e.target.value)}
              />
              No
            </label>
          </div>
        </div> */}

        <button
          type="submit"
          className="addproduc t bg-white text-black mt-32  ml-1  rounded p-1 font-[inter-regular]"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}

export default AdminAddProduct;
