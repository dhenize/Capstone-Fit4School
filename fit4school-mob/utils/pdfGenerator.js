
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const generateAndSharePDF = async (htmlContent, fileName) => {
    try {
       
        const { uri } = await printToFileAsync({
            html: htmlContent,
            base64: false,
        });

        
        const pdfName = `${fileName}.pdf`;
        const destinationUri = `${FileSystem.documentDirectory}${pdfName}`;

        
        await FileSystem.moveAsync({
            from: uri,
            to: destinationUri,
        });

        
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