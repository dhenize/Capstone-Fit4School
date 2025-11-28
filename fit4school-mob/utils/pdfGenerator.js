// utils/pdfGenerator.js
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const generateAndSharePDF = async (htmlContent, fileName) => {
    try {
        // Generate PDF file
        const { uri } = await printToFileAsync({
            html: htmlContent,
            base64: false,
        });

        // Get the destination path
        const pdfName = `${fileName}.pdf`;
        const destinationUri = `${FileSystem.documentDirectory}${pdfName}`;

        // Move the file to permanent storage
        await FileSystem.moveAsync({
            from: uri,
            to: destinationUri,
        });

        // Share the file - this will allow user to save/download
        await shareAsync(destinationUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Download ${pdfName}`,
            UTI: 'com.adobe.pdf'
        });

        console.log('PDF generated and shared successfully:', destinationUri);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};