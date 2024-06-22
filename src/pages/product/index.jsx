import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '../../components/Loader';
import './Index.css';  // Import the new CSS file

const Index = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productCounts, setProductCounts] = useState({});
  const [telegramUserId, setTelegramUserId] = useState(localStorage.getItem('telegramUserId'));
  const navigate = useNavigate();

  const telegram = window.Telegram.WebApp;
  
  useEffect(() => {
    const fetchSelectedProducts = async () => {
      try {
        const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts')) || [];
        console.log(selectedProducts);
        if (selectedProducts.length === 0) {
          setLoading(false);
          return;
        }

        const productIds = selectedProducts.map(item => item.productId);
        const response = await fetch('https://botproject.uz/api/products/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productIds)
        });
        const data = await response.json();
        if (response.ok) {
          setProducts(data.data);
          const counts = {};
          selectedProducts.forEach(item => {
            counts[item.productId] = item.count;
          });
          setProductCounts(counts);
          setLoading(false);
        } else {
          toast.error(data.message || "Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi");
          setLoading(false);
        }
      } catch (error) {
        console.error("Mahsulot ma'lumotlarini yuklashda xatolik", error);
        toast.error("Mahsulot ma'lumotlarini yuklashda xatolik");
        setLoading(false);
      }
    };

    fetchSelectedProducts();

    // Clear localStorage when the app is closed
    window.addEventListener('beforeunload', () => {
      localStorage.clear();
    });
  }, []);

  const handlePay = async () => {
    try {
      const orderDataForPost = products.map((product) => ({
        order_telegram_id: telegramUserId,
        order_product_name: product.product_name,
        order_count: productCounts[product._id]
      }));

      const orderData = products.map((product) => ({
        order_telegram_id: telegramUserId,
        order_product_id: product._id,
        order_count: productCounts[product._id]
      }));

      const response = await fetch('https://botproject.uz/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Buyurtma muvaffaqiyatli amalga oshirildi!');
        const secondApiResponse = {
          ok: true,
          order: orderDataForPost.reduce((acc, curr) => {
            acc[`product_${curr.order_product_name}`] = {
              quantity: curr.order_count,
              name: curr.order_product_name,
            };
            return acc;
          }, { user_id: telegramUserId })
        }
        const secondResponse = await fetch('https://vermino.uz/bots/orders/CatDeliver/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(secondApiResponse)
        });


        localStorage.removeItem('selectedProducts');

        setTimeout(() => {
          navigate("/")
          telegram.close()
        }, 700);

      } else {

        toast.error(data.message || 'Buyurtmani amalga oshirishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Buyurtmani amalga oshirishda xatolik:', error);
      toast.error('Buyurtmani amalga oshirishda xatolik');
    }
  };

  const handleBack = () => {
    localStorage.removeItem('selectedProducts');
    navigate("/");
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center">
        <h3 className="mb-4">Mahsulot tafsilotlari</h3>
        <button type="button" className="btn btn-secondary" onClick={handleBack}>Orqaga</button>
      </div>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nomi</th>
            <th>Rasm</th>
            <th>Soni</th>
            <th>Narxi</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={index}>
              <td>{product.product_name}</td>
              <td>
                <img
                  src={`https://botproject.uz/api/images/${product.product_image}`}
                  className="img-fluid"
                  alt={product.product_name}
                  style={{ height: "100px", width: "100px", objectFit: "cover" }}
                />
              </td>
              <td>{productCounts[product._id] || 1}</td>
              <td>{(product.product_price * (productCounts[product._id] || 1)).toFixed(2)} so'm</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary w-100 paycha" onClick={handlePay}>Buyurtma berish</button>
      <ToastContainer />
    </div>
  );
};

export default Index;
