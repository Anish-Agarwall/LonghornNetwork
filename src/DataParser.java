import java.io.*;
import java.util.*;

public class DataParser {
    public static List<UniversityStudent> parseStudents(String filename) throws IOException {
        //return new ArrayList<>();

        // student list
        List<UniversityStudent> students = new ArrayList<>();

        // creates the reader
        BufferedReader reader = new BufferedReader(new FileReader(filename));

        // initlaizes verything
        String line;
        String name = null;
        int age = 0;
        String gender = null;
        int year = 0;
        String major = null;
        double gpa = 0.0;
        List<String> roommatePrefs = new ArrayList<>();
        List<String> internships = new ArrayList<>();

        while ((line = reader.readLine()) != null) {
            line = line.trim();
            if (line.isEmpty()) {
                // End of student block - save if we have a name
                if (name != null) {
                    students.add(new UniversityStudent(name, age, gender, year, major, gpa, roommatePrefs, internships));
                    name = null; age = 0; gender = null; year = 0;
                    major = null; gpa = 0.0;
                    roommatePrefs = new ArrayList<>();
                    internships = new ArrayList<>();
                }
                continue;
            }

    }
}
