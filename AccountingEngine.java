import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.HashMap;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TextField;

public class AccountingEngine {

    private String tableName;
    private String directory;
    private boolean debitAcct;
    private ComboBox<String> comboBox;
    private TextField tfDebit;
    private TextField tfCredit;
    private TextField tfNote;
    private TextField tfCustomerName;
    private TextField tfVatNumber;
    private Connection connection;

    public AccountingEngine(boolean debitAcct, String tableName, String directory, Connection connection) {
        this.debitAcct = debitAcct;
        this.tableName = tableName;
        this.directory = directory;
        this.connection = connection;
        comboBox = new ComboBox<>();
        tfDebit = new TextField("0.00");
        tfCredit = new TextField("0.00");
        tfNote = new TextField();
        
        // الخانات الجديدة
        tfCustomerName = new TextField();
        tfCustomerName.setPromptText("اسم العميل");
        
        tfVatNumber = new TextField();
        tfVatNumber.setPromptText("الرقم الضريبي (15 رقم)");
    }

    // دالة التحقق من الرقم الضريبي حسب الشروط الصارمة
    public boolean isVatValid() {
        String vat = tfVatNumber.getText();
        // شرط: 15 رقم، يبدأ بـ 3، ينتهي بـ 3
        return vat.matches("3[0-9]{13}3");
    }

    public void recordTransaction(String date, HashMap<String, Integer> map) throws SQLException {
        if (!isVatValid()) {
            System.out.println("خطأ: الرقم الضريبي غير صالح! يجب أن يبدأ بـ 3 وينتهي بـ 3 وطوله 15 رقماً.");
            return;
        }

        String query = "INSERT INTO " + tableName + " (dateOfTransaction, accountTitle, debit, credit, note, customerName, vatNumber) VALUES (?, ?, ?, ?, ?, ?, ?);";
        PreparedStatement entry = connection.prepareStatement(query);

        entry.setString(1, date);
        entry.setString(2, comboBox.getValue());
        entry.setDouble(3, Double.parseDouble(tfDebit.getText()));
        entry.setDouble(4, Double.parseDouble(tfCredit.getText()));
        entry.setString(5, tfNote.getText());
        entry.setString(6, tfCustomerName.getText());
        entry.setString(7, tfVatNumber.getText());

        entry.executeUpdate();
        System.out.println("تم الحفظ بنجاح مع مطابقة معايير الزكاة.");
    }
}
