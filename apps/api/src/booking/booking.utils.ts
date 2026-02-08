

export function generateTenantReminderEmail(data: {
    tenantName: string;
    bookingId: string;
    assetName: string;
    customerName: string;
    formattedStartDate: string;
    formattedEndDate: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Reminder</h1>
          </div>
          <div class="content">
            <p>Hello ${data.tenantName},</p>
            <p>This is a reminder that you have an upcoming booking starting tomorrow.</p>

            <div class="booking-details">
              <h2 style="color: #2563eb; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span> ${data.customerName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            <p>Please ensure that <strong>${data.assetName}</strong> is ready for the customer.</p>

            <div class="footer">
              <p>This is an automated reminder from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

export function generateCustomerReminderEmail(data: {
    customerName: string;
    bookingId: string;
    assetName: string;
    formattedStartDate: string;
    formattedEndDate: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
          .highlight { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Booking is Tomorrow!</h1>
          </div>
          <div class="content">
            <p>Hello ${data.customerName},</p>
            <p>This is a friendly reminder that your booking starts tomorrow.</p>

            <div class="booking-details">
              <h2 style="color: #2563eb; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            <div class="highlight">
              <strong>Important:</strong> Please be prepared to pick up <strong>${data.assetName}</strong> on ${data.formattedStartDate}.
            </div>

            <p>If you have any questions or need to make changes to your booking, please contact us as soon as possible.</p>

            <p>We look forward to serving you!</p>

            <div class="footer">
              <p>This is an automated reminder from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

export function generateStatusUpdateEmailForTenant(data: {
    tenantName: string;
    bookingId: string;
    assetName: string;
    customerName: string;
    formattedStartDate: string;
    formattedEndDate: string;
    status: 'Confirmed' | 'Cancelled';
  }): string {
    const isConfirmed = data.status === 'Confirmed';
    const headerColor = isConfirmed ? '#2563eb' : '#dc2626';
    const headerText = isConfirmed ? 'Booking Confirmed' : 'Booking Cancelled';
    const statusBgColor = isConfirmed ? '#dbeafe' : '#fee2e2';
    const statusTextColor = isConfirmed ? '#1e40af' : '#991b1b';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .status-badge { background-color: ${statusBgColor}; color: ${statusTextColor}; padding: 8px 16px; border-radius: 6px; display: inline-block; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.tenantName},</p>
            <p>A booking has been <strong>${data.status.toLowerCase()}</strong>.</p>

            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge">${data.status.toUpperCase()}</span>
            </div>

            <div class="booking-details">
              <h2 style="color: ${headerColor}; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Customer:</span> ${data.customerName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            ${isConfirmed
              ? `<p>Please ensure that <strong>${data.assetName}</strong> is ready for the customer on ${data.formattedStartDate}.</p>`
              : `<p>The booking for <strong>${data.assetName}</strong> has been cancelled and the asset is now available for other bookings.</p>`
            }

            <div class="footer">
              <p>This is an automated notification from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

export function generateStatusUpdateEmailForCustomer(data: {
    customerName: string;
    bookingId: string;
    assetName: string;
    formattedStartDate: string;
    formattedEndDate: string;
    status: 'Confirmed' | 'Cancelled';
  }): string {
    const isConfirmed = data.status === 'Confirmed';
    const headerColor = isConfirmed ? '#2563eb' : '#dc2626';
    const headerText = isConfirmed ? 'Your Booking is Confirmed!' : 'Your Booking Has Been Cancelled';
    const statusBgColor = isConfirmed ? '#dbeafe' : '#fee2e2';
    const statusTextColor = isConfirmed ? '#1e40af' : '#991b1b';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .detail-label { font-weight: bold; color: #64748b; }
          .status-badge { background-color: ${statusBgColor}; color: ${statusTextColor}; padding: 8px 16px; border-radius: 6px; display: inline-block; font-weight: bold; }
          .highlight { background-color: ${isConfirmed ? '#fef3c7' : '#fee2e2'}; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${headerText}</h1>
          </div>
          <div class="content">
            <p>Hello ${data.customerName},</p>
            <p>${isConfirmed
              ? 'Great news! Your booking has been confirmed.'
              : 'This email confirms that your booking has been cancelled.'
            }</p>

            <div style="text-align: center; margin: 20px 0;">
              <span class="status-badge">${data.status.toUpperCase()}</span>
            </div>

            <div class="booking-details">
              <h2 style="color: ${headerColor}; margin-top: 0;">Booking Details</h2>
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span> ${data.bookingId}
              </div>
              <div class="detail-row">
                <span class="detail-label">Asset:</span> ${data.assetName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date:</span> ${data.formattedStartDate}
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date:</span> ${data.formattedEndDate}
              </div>
            </div>

            <div class="highlight">
              <strong>${isConfirmed ? 'Important:' : 'Note:'}</strong> ${isConfirmed
                ? `Please be prepared to pick up <strong>${data.assetName}</strong> on ${data.formattedStartDate}.`
                : 'If you cancelled by mistake or would like to create a new booking, please contact us.'
              }
            </div>

            ${isConfirmed
              ? '<p>If you have any questions or need to make changes, please contact us as soon as possible.</p>'
              : '<p>Thank you for letting us know. We hope to serve you again in the future.</p>'
            }

            <p>We ${isConfirmed ? 'look forward to serving you' : 'appreciate your understanding'}!</p>

            <div class="footer">
              <p>This is an automated notification from your booking management system.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
