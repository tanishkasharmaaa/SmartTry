import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const SingleProd = () => {
   const { id } = useParams(); // product id
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`https://smarttry.onrender.com/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((err) => console.error(err));
  }, [id]);

  if (!product) return <h2>Loading...</h2>;

  return (
    <div>
      <h1>{product.name}</h1>
      <img src={product.image} alt={product.name} width="300" />
      <h2>₹{product.price}</h2>
      <p>{product.description}</p>
    </div>
  );
}
export default SingleProd;