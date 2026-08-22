import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import "./AdminPayments.css";

export default function AdminPayments() {

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const fetchPayments = async () => {

    try {

      setLoading(true);
      setError("");


      // Get payment records
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select(`
          id,
          order_id,
          amount,
          status,
          payment_method,
          reference_number,
          payment_id,
          paid_at,
          created_at
        `)
        .order("created_at", { ascending: false });


      if (paymentError) throw paymentError;


      // Get related orders
      const orderIds = paymentData
        .map(payment => payment.order_id)
        .filter(Boolean);


      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          full_name,
          email,
          mobile_number,
          status,
          payment_status
        `)
        .in("id", orderIds);


      if (orderError) throw orderError;



      // Merge payment + order information
      const mergedPayments = paymentData.map(payment => ({

        ...payment,

        orders: orderData.find(
          order => order.id === payment.order_id
        )

      }));



      console.log(
        "🔥 MERGED PAYMENTS RESULT 🔥",
        mergedPayments
      );


      setPayments(mergedPayments);



    } catch (err) {

      console.error(
        "Payment fetch error:",
        err
      );

      setError(
        "Failed to load payments."
      );


    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchPayments();

  }, []);




  const totalRevenue = payments
    .filter(payment => payment.status === "paid")
    .reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );



  const paidCount = payments.filter(
    payment => payment.status === "paid"
  ).length;



  const pendingCount = payments.filter(
    payment => payment.status === "pending"
  ).length;



  const failedCount = payments.filter(
    payment => payment.status === "failed"
  ).length;




  const formatCurrency = (amount) => {

    return new Intl.NumberFormat(
      "en-PH",
      {
        style: "currency",
        currency: "PHP"
      }
    ).format(amount);

  };




  const formatDate = (date) => {

    if (!date) return "-";

    return new Date(date)
      .toLocaleDateString(
        "en-PH",
        {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
      );

  };




  return (

    <div className="admin-payments-container">


      <div className="admin-payments-header">

        <h2>
          Payment Management
        </h2>

        <p>
          Monitor customer transactions and PayMongo payment records.
        </p>

      </div>




      <div className="payment-summary-cards">


        <div className="payment-card">

          <h3>
            Total Revenue
          </h3>

          <p>
            {formatCurrency(totalRevenue)}
          </p>

        </div>




        <div className="payment-card">

          <h3>
            Paid Transactions
          </h3>

          <p>
            {paidCount}
          </p>

        </div>




        <div className="payment-card">

          <h3>
            Pending Payments
          </h3>

          <p>
            {pendingCount}
          </p>

        </div>




        <div className="payment-card">

          <h3>
            Failed Payments
          </h3>

          <p>
            {failedCount}
          </p>

        </div>


      </div>





      <div className="payment-table-container">


        <h3>
          Payment Transactions
        </h3>



        {loading && (

          <p>
            Loading payments...
          </p>

        )}




        {error && (

          <p className="payment-error">

            {error}

          </p>

        )}






        {!loading && !error && (


          <table className="payment-table">


            <thead>

              <tr>

                <th>
                  Customer
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Method
                </th>

                <th>
                  Status
                </th>

                <th>
                  Reference
                </th>

                <th>
                  Paid Date
                </th>

              </tr>

            </thead>




            <tbody>


              {payments.length === 0 ? (


                <tr>

                  <td
                    colSpan="6"
                    className="empty-payment"
                  >
                    No payment records found.
                  </td>

                </tr>



              ) : (


                payments.map(payment => (


                  <tr key={payment.id}>


                    <td>

                      {payment.orders?.full_name || "Unknown"}

                    </td>



                    <td>

                      {formatCurrency(payment.amount)}

                    </td>



                    <td>

                      {payment.payment_method
                        ? payment.payment_method.toUpperCase()
                        : "-"
                      }

                    </td>



                    <td>

                      <span
                        className={`status ${payment.status}`}
                      >

                        {payment.status}

                      </span>

                    </td>



                    <td>

                      {payment.reference_number}

                    </td>



                    <td>

                      {formatDate(payment.paid_at)}

                    </td>



                  </tr>


                ))


              )}


            </tbody>



          </table>


        )}


      </div>



    </div>

  );

}