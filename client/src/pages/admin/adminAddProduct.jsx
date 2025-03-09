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

  const [sections, setSections] = useState([
    { title: "Section-1", content: ["content-1", "content-2"] },
    { title: "Section-2", content: [] },
  ]);
const [hastags, setHastags] = useState(['dark', 'aesthetic']);


  let [cashOnDelivery, setCashOnDelivery] = useState("");
  let [returnOnDelivery, setReturnOnDelivery] = useState("");
  let [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [image, setSelectedImage] = useState([]);

  const addSections = () => {
    setSections([
      ...sections,
      { title: `Section-${sections.length + 1}`, content: [] },
    ]);
  };

  const addContent = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].content.push(
      `content-${updatedSections[sectionIndex].content.length + 1}`
    );
    setSections(updatedSections);
  };

  const formSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("headline", headline);
    formData.append("amount", amount);
    formData.append("cashOnDelivery", cashOnDelivery);
    formData.append("returnOnDelivery", returnOnDelivery);
    formData.append("expectedDeliveryDate", expectedDeliveryDate);

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
      <h1 className="mb-20">Admin panel</h1>

      <form onSubmit={formSubmit}>
        <input
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]"
        />

        <ImageInput selectedImage={image} setSelectedImage={setSelectedImage} />

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount $"
          className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[4vw]"
        />

        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]"
        />

        <div className="other-information mt-20 mb-32">
          <h3 className="mb-8">Section Information:</h3>

          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="w-full border border-[#424242] p-3">
              <input
                type="text"
                placeholder="Title"
                className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]"
                value={section.title}
                onChange={(e) => {
                  const updatedSections = [...sections];
                  updatedSections[sectionIndex].title = e.target.value;
                  setSections(updatedSections);
                }}
              />

              {section.content.map((cont, contentIndex) => (
                <input
                  key={contentIndex}
                  type="text"
                  placeholder="Content"
                  className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw]"
                  value={cont}
                  onChange={(e) => {
                    const updatedSections = [...sections];
                    updatedSections[sectionIndex].content[contentIndex] = e.target.value;
                    setSections(updatedSections);
                  }}
                />
              ))}

              <button
                type="button"
                onClick={() => addContent(sectionIndex)}
                className="bg-white text-black font-[inter-regular] p-1 ml-2 mt-4 rounded"
              >
                Add Content
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addSections}
            className="bg-white text-black mt-5 rounded p-1 font-[inter-regular]"
          >
            Add Section
          </button>
        </div>

        <div>
          <h3 className="mb-10">Related Product</h3>
          <TagInput  hastags = {hastags} setHastags = {setHastags}/>
        </div>

        <div>
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
        </div>

        <button
          type="submit"
          className="addproduct bg-white text-black mt-5 rounded p-1 font-[inter-regular]"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}

export default AdminAddProduct;
