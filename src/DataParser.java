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

            if (!line.contains(":")) {
                continue;
            }

            int sepIdx = line.indexOf(":");
            String key = line.substring(0, sepIdx).trim().toLowerCase();
            String value = line.substring(sepIdx + 1).trim();

            switch (key) {

                case "name":
                    name = value;
                    break;
                case "age":
                    try {
                        age = Integer.parseInt(value);
                    } catch (NumberFormatException ignored) {

                    }
                    break;
                case "gender":
                    gender = value;
                    break;
                case "year":
                    try {
                        year = Integer.parseInt(value);
                    } catch (NumberFormatException ignored) {

                    }
                    break;
                case "major":
                    major = value;
                    break;
                case "gpa":
                    try {
                        gpa = Double.parseDouble(value);
                    } catch (NumberFormatException ignored) {

                    }
                    break;
                case "roommatepreferences":

                case "roommate preferences":
                    if (!value.isEmpty()) {
                        for (String pref : value.split(",")) {
                            String trimmed = pref.trim();
                            if (!trimmed.isEmpty()) {
                                roommatePrefs.add(trimmed);
                            }
                        }
                    }
                    break;
                case "previousinternships":

                case "previous internships":

                case "internships":
                    if (!value.isEmpty()) {
                        for (String intern : value.split(",")) {
                            String trimmed = intern.trim();
                            if (!trimmed.isEmpty()) {
                                internships.add(trimmed);
                            }
                        }
                    }
                    break;
            }


        }

        // Save last student if file doesn't end with blank line
        if (name != null) {
            students.add(new UniversityStudent(name, age, gender, year, major, gpa, roommatePrefs, internships));
        }

        reader.close();
        return students;

    }
}
