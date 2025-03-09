import { useEffect } from "react";
import axios from "axios";

const RazorpayCheckout = ({ amount }) => {
    const handlePayment = async () => {
        const { data } = await axios.post("/api/payment/create-order", { amount });

        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,
            amount: data.amount,
            currency: "INR",
            name: "Meeza Poster Shop",
            description: "Purchase Posters",
            order_id: data.id,
            handler: (response) => {
                console.log(response);
                alert("Payment Successful!");
            },
            theme: { color: "#121212" },
        };

        const razor = new window.Razorpay(options);
        razor.open();
    };

    return (
        <button
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            onClick={handlePayment}
        >
            Pay with Razorpay
        </button>
    );
};

export default RazorpayCheckout;
