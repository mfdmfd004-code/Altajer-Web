import java.io.File;
import java.io.FileNotFoundException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Scanner;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.RadioButton;
import javafx.scene.control.TextField;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.HBox;

public class AccountingEngine {

    private String tableName;
    private String directory;
    private boolean debitAcct;
    private ComboBox<String> comboBox;
    private Label lblAcct;
    private TextField tfDebit;
    private TextField tfCredit;
    private TextField tfNote;
    private PreparedStatement entry;
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
        setNodeProperties();
    }

    public void recordTransaction(String date, HashMap<String, Integer> map) throws SQLException {
        // سيتم إضافة منطق الضريبة هنا لاحقاً
        System.out.println("Engine Ready for ZATCA integration.");
    }

    private void setNodeProperties() {
        comboBox.setPrefWidth(320);
    }
}
