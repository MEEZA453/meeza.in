import React, { useEffect, useState } from "react";
import TagInput from "../../components/inputs/taginput.jsx";
import ImageInput from "../../components/inputs/imageInput.jsx";
import { useDispatch, useSelector } from "react-redux";
import { postDesign, getDesign , deleteDesign } from "../../store/actions/design.js";

function AdminAddProduct() {
  const dispatch = useDispatch();
  const designs = useSelector((state) => state.design); // same selector you're using in ProductAll
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [amount, setAmount] = useState("");
  const [image, setSelectedImage] = useState([]);
  const [hastags, setHastags] = useState(["dark", "aesthetic"]);
  const [sections, setSections] = useState([{ title: "", content: ["", ""] }]);

  // Fetch designs using getDesign
  useEffect(() => {
    dispatch(getDesign(1)); // Fetch first page; extend if you awant all pages
  }, [dispatch]);

  const addSections = () => setSections([...sections, { title: "", content: [] }]);

  const addContent = (sectionIndex) => {
    const updated = [...sections];
    updated[sectionIndex].content.push("");
    setSections(updated);
  };

  const deleteContent = (sectionIndex, contentIndex) => {
    setSections((prev) =>
      prev.map((section, i) => {
        if (i === sectionIndex) {
          const filtered = section.content.filter((_, idx) => idx !== contentIndex);
          return { ...section, content: filtered };
        }
        return section;
      })
    );
  };

  const deleteSection = () => {
    if (sections.length > 1) {
      setSections(sections.slice(0, -1));
    }
  };

  const formSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("headline", headline);
    formData.append("amount", amount);
    image.forEach((file) => formData.append("images", file));
    formData.append("sections", JSON.stringify(sections));
    formData.append("hastags", JSON.stringify(hastags));
    dispatch(postDesign(formData));
  };

const deleteProduct = async (id) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this product?");
  if (!confirmDelete) return;

  dispatch(deleteDesign(id)); // uses Redux action
};
  return (
    <div>
      <h1 className="mb-20 mt-5">Admin panel</h1>

      <form onSubmit={formSubmit}>
        <div className="flex gap-1">
          <input
            type="text"
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
            className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[15vw] lg:w-[4vw]"
          />
        </div>

        <ImageInput selectedImage={image} setSelectedImage={setSelectedImage} />

        <textarea
          rows={2}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          className="bg-transparent py-[3px] border-[#424242] px-1 mb-2 border rounded w-[70%] lg:w-[15vw]"
        />

        <div className="other-information lg:mt-20 lg:mb-32">
          <h3 className="lg:mb-8 mb-2">Section Info:</h3>
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="w-full lg:mb-7 pt-3 lg:p-3">
              <input
                type="text"
                placeholder="Title"
                className="bg-transparent w-full py-[3px] border-[#424242] px-1 mb-2 border rounded lg:w-[15vw]"
                value={section.title}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[sectionIndex].title = e.target.value;
                  setSections(updated);
                }}
              />

              {section.content.map((cont, contentIndex) => (
                <div className="flex" key={contentIndex}>
                  <textarea
                    placeholder="Content"
                    className="bg-transparent w-full py-[3px] border-[#424242] px-1 lg:mb-2 border rounded lg:w-[15vw]"
                    value={cont}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[sectionIndex].content[contentIndex] = e.target.value;
                      setSections(updated);
                    }}
                  />
                  <button
                    className="bg-white mr-2 ml-2 text-black mt-5 rounded p-1"
                    type="button"
                    onClick={() => deleteContent(sectionIndex, contentIndex)}
                  >
                    del
                  </button>
                </div>
              ))}

              <div className="flex w-full justify-between">
                <p className="text-red-500">please fill the content</p>
                <button
                  type="button"
                  onClick={() => addContent(sectionIndex)}
                  className="bg-white mt-3 text-black p-1 ml-2 rounded"
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
              className="bg-white mr-2 text-black mt-5 rounded p-1"
            >
              delete Section
            </button>
            <button
              type="button"
              onClick={addSections}
              className="bg-white text-black mt-5 rounded p-1"
            >
              Add Section
            </button>
          </div>
        </div>

        <TagInput hastags={hastags} setHastags={setHastags} />

        <button
          type="submit"
          className="bg-white text-black mt-16 ml-1 rounded p-1"
        >
          Add Product
        </button>
      </form>

      <div className="mt-10">
        <h3 className="text-xl mb-4 px-2">All Products (Delete Option)</h3>
        <div className="px-3">
          {designs.length > 0 ? (
            designs.map((product) => (
              <div
                key={product._id}
                className="border border-gray-600 rounded p-2 mb-2 flex justify-between items-center"
              >
                <p>{product.name}</p>
                <button
                  onClick={() => deleteProduct(product._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAddProduct;
