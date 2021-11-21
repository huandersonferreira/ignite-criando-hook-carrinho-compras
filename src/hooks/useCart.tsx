import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if(storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productCart = cart.find(product => product.id === productId);

      if (productCart) {
        updateProductAmount({productId, amount: productCart.amount + 1});
      }else{
        const { data } = await api.get<Product>(`products/${productId}`);

        if (!data) {
          toast.error('Erro na adição do produto');
        }
        
        data.amount = 1;
        setCart([...cart, data])

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, data]));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productCart = cart.findIndex(product => product.id === productId);

      if (productCart >= 0) {
        cart.splice(productCart, 1)
  
        setCart([...cart])
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }else{
        throw new Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
};

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productCart = cart.find(product => product.id === productId);
      const { data } = await api.get<Stock>(`stock/${productId}`);

      if(productCart) {
        if(amount <= data.amount) {
          if(amount >= 1){
            productCart.amount = amount;
            setCart(prevState => {
              return [...prevState];
            });

            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          }
        }else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
